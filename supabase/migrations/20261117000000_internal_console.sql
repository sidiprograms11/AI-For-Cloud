-- Premier lot interne. Aucune table ci-dessous n'est exposée directement aux clients.
create table public.internal_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('member', 'reviewer', 'publisher')),
  created_at timestamptz not null default now()
);

create table public.internal_cases (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id),
  active_version_id uuid,
  created_at timestamptz not null default now()
);

create table public.internal_case_versions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.internal_cases (id) on delete cascade,
  version_no integer not null check (version_no > 0),
  revision integer not null default 1 check (revision > 0),
  state text not null default 'draft'
    check (state in ('draft', 'tested', 'in_review', 'reviewed', 'active', 'superseded')),
  title text not null check (length(trim(title)) between 3 and 160),
  company_context text not null check (length(trim(company_context)) between 10 and 4000),
  constraints jsonb not null default '{}'::jsonb
    check (jsonb_typeof(constraints) = 'object'),
  created_by uuid not null references auth.users (id),
  reviewed_by uuid references auth.users (id),
  published_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  published_at timestamptz,
  unique (case_id, version_no),
  unique (case_id, id)
);

alter table public.internal_cases
  add constraint internal_cases_active_version_fk
  foreign key (id, active_version_id)
  references public.internal_case_versions (case_id, id);

create index internal_case_versions_case_idx
  on public.internal_case_versions (case_id, version_no desc);

create table public.internal_case_tests (
  id uuid primary key default gen_random_uuid(),
  case_version_id uuid not null references public.internal_case_versions (id) on delete cascade,
  version_revision integer not null check (version_revision > 0),
  run_by uuid not null references auth.users (id),
  status text not null check (status in ('simulated')),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  configuration jsonb not null check (jsonb_typeof(configuration) = 'object'),
  created_at timestamptz not null default now()
);
create index internal_case_tests_version_idx
  on public.internal_case_tests (case_version_id, created_at desc);

create table public.internal_case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.internal_cases (id) on delete cascade,
  case_version_id uuid references public.internal_case_versions (id),
  action text not null,
  actor_id uuid not null references auth.users (id),
  details jsonb not null default '{}'::jsonb
    check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now()
);
create index internal_case_events_case_idx
  on public.internal_case_events (case_id, created_at desc);

alter table public.internal_members enable row level security;
alter table public.internal_cases enable row level security;
alter table public.internal_case_versions enable row level security;
alter table public.internal_case_tests enable row level security;
alter table public.internal_case_events enable row level security;

-- Même un utilisateur Auth connecté ne lit pas la console via la Data API.
revoke all on public.internal_members, public.internal_cases,
  public.internal_case_versions, public.internal_case_tests,
  public.internal_case_events from public, anon, authenticated;
grant all on public.internal_members, public.internal_cases,
  public.internal_case_versions, public.internal_case_tests,
  public.internal_case_events to service_role;

-- Création atomique du cas et de sa première version.
create function public.create_internal_case(
  p_title text, p_company_context text, p_constraints jsonb, p_actor_id uuid
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_case_id uuid;
  v_version_id uuid;
begin
  insert into public.internal_cases (created_by)
  values (p_actor_id) returning id into v_case_id;
  insert into public.internal_case_versions
    (case_id, version_no, title, company_context, constraints, created_by)
  values (v_case_id, 1, p_title, p_company_context, p_constraints, p_actor_id)
  returning id into v_version_id;
  insert into public.internal_case_events (case_id, case_version_id, action, actor_id)
  values (v_case_id, v_version_id, 'created', p_actor_id);
  return v_case_id;
end;
$$;

-- Un nouveau brouillon copie la version active sans la modifier.
create function public.create_internal_case_draft(p_case_id uuid, p_actor_id uuid)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_active public.internal_case_versions%rowtype;
  v_version_id uuid;
  v_next integer;
begin
  perform 1 from public.internal_cases where id = p_case_id for update;
  if not found then raise exception 'case_not_found'; end if;
  if exists (
    select 1 from public.internal_case_versions
    where case_id = p_case_id and state in ('draft', 'tested', 'in_review', 'reviewed')
  ) then raise exception 'open_draft_exists'; end if;
  select v.* into v_active from public.internal_case_versions v
  join public.internal_cases c on c.active_version_id = v.id
  where c.id = p_case_id;
  if not found then raise exception 'active_version_missing'; end if;
  select max(version_no) + 1 into v_next
  from public.internal_case_versions where case_id = p_case_id;
  insert into public.internal_case_versions
    (case_id, version_no, title, company_context, constraints, created_by)
  values (p_case_id, v_next, v_active.title, v_active.company_context,
    v_active.constraints, p_actor_id)
  returning id into v_version_id;
  insert into public.internal_case_events (case_id, case_version_id, action, actor_id)
  values (p_case_id, v_version_id, 'draft_created', p_actor_id);
  return v_version_id;
end;
$$;

-- Bascule atomique et traçable, également utilisée pour revenir à une version publiée.
create function public.activate_internal_case_version(
  p_case_id uuid, p_version_id uuid, p_actor_id uuid, p_rollback boolean default false
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_previous_id uuid;
  v_target public.internal_case_versions%rowtype;
begin
  select active_version_id into v_previous_id
  from public.internal_cases where id = p_case_id for update;
  if not found then raise exception 'case_not_found'; end if;
  select * into v_target from public.internal_case_versions
  where id = p_version_id and case_id = p_case_id for update;
  if not found then raise exception 'version_not_found'; end if;
  if p_rollback then
    if v_target.state <> 'superseded' or v_target.published_at is null then
      raise exception 'not_previous_active_version';
    end if;
  elsif v_target.state <> 'reviewed' then
    raise exception 'version_not_reviewed';
  end if;
  if v_previous_id is not null then
    update public.internal_case_versions set state = 'superseded'
    where id = v_previous_id;
  end if;
  update public.internal_case_versions
  set state = 'active', published_by = p_actor_id, published_at = now()
  where id = p_version_id;
  update public.internal_cases set active_version_id = p_version_id
  where id = p_case_id;
  insert into public.internal_case_events
    (case_id, case_version_id, action, actor_id, details)
  values (p_case_id, p_version_id,
    case when p_rollback then 'rollback' else 'published' end,
    p_actor_id, jsonb_build_object('previous_version_id', v_previous_id));
end;
$$;

revoke all on function public.create_internal_case(text, text, jsonb, uuid)
  from public, anon, authenticated;
revoke all on function public.create_internal_case_draft(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.activate_internal_case_version(uuid, uuid, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.create_internal_case(text, text, jsonb, uuid)
  to service_role;
grant execute on function public.create_internal_case_draft(uuid, uuid)
  to service_role;
grant execute on function public.activate_internal_case_version(uuid, uuid, uuid, boolean)
  to service_role;

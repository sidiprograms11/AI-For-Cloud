create extension if not exists pgcrypto with schema extensions;
create extension if not exists vector with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Nouvelle conversation',
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index conversations_owner_created_idx
  on public.conversations (owner_id, created_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (length(trim(content)) > 0),
  status text not null default 'complete' check (status in ('pending', 'complete', 'failed')),
  created_at timestamptz not null default now()
);
create index messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

create table public.requirements (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  version integer not null check (version > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  missing_fields jsonb not null default '[]'::jsonb
    check (jsonb_typeof(missing_fields) = 'array'),
  created_at timestamptz not null default now(),
  unique (conversation_id, version)
);
create index requirements_conversation_version_idx
  on public.requirements (conversation_id, version desc);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('aws', 'azure', 'gcp')),
  url text not null,
  title text not null,
  version text,
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  status text not null default 'needs_review'
    check (status in ('verified', 'needs_review', 'withdrawn')),
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (url, content_sha256)
);

create table public.chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete restrict,
  chunk_index integer not null check (chunk_index >= 0),
  title text not null,
  content text not null check (length(trim(content)) > 0),
  embedding extensions.vector,
  embedding_model text,
  created_at timestamptz not null default now(),
  unique (source_id, chunk_index),
  check ((embedding is null) = (embedding_model is null))
);
create index chunks_source_idx on public.chunks (source_id, chunk_index);

create table public.cloud_services (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('aws', 'azure', 'gcp')),
  service_key text not null,
  service_name text not null,
  summary text not null,
  attributes jsonb not null default '{}'::jsonb
    check (jsonb_typeof(attributes) = 'object'),
  source_id uuid not null references public.sources (id) on delete restrict,
  is_fixture boolean not null default false,
  created_at timestamptz not null default now(),
  unique (provider, service_key)
);

create table public.criteria (
  id uuid primary key default gen_random_uuid(),
  criterion_key text not null unique,
  label text not null,
  description text not null,
  source_id uuid references public.sources (id) on delete restrict,
  is_fixture boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.requirements (id) on delete restrict,
  status text not null default 'draft'
    check (status in ('draft', 'validated', 'failed', 'superseded')),
  result jsonb check (result is null or jsonb_typeof(result) = 'object'),
  model_version text,
  prompt_version text,
  catalogue_version text,
  created_at timestamptz not null default now()
);
create index recommendations_requirement_created_idx
  on public.recommendations (requirement_id, created_at desc);

create table public.recommendation_sources (
  recommendation_id uuid not null references public.recommendations (id) on delete cascade,
  chunk_id uuid not null references public.chunks (id) on delete restrict,
  claim text not null,
  primary key (recommendation_id, chunk_id, claim)
);

create table public.ai_requests (
  request_id uuid primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  operation text not null,
  provider text not null,
  model text not null,
  prompt_version text,
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  estimated_cost numeric(14, 6) check (estimated_cost is null or estimated_cost >= 0),
  currency char(3),
  status text not null check (status in ('reserved', 'completed', 'failed', 'reconcile')),
  created_at timestamptz not null default now()
);

create table public.budget_reservations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.ai_requests (request_id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  budget_scope text not null check (budget_scope in ('user', 'global')),
  reserved_amount numeric(14, 6) not null check (reserved_amount >= 0),
  currency char(3) not null,
  status text not null check (status in ('reserved', 'settled', 'released', 'reconcile')),
  created_at timestamptz not null default now(),
  settled_at timestamptz
);
create index budget_reservations_owner_status_idx
  on public.budget_reservations (owner_id, status);

create table public.exports (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.recommendations (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null unique,
  format text not null check (format in ('pdf', 'markdown')),
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  created_at timestamptz not null default now()
);
create index exports_owner_created_idx on public.exports (owner_id, created_at desc);

-- Active RLS before any table is exposed through the Supabase Data API.
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.requirements enable row level security;
alter table public.sources enable row level security;
alter table public.chunks enable row level security;
alter table public.cloud_services enable row level security;
alter table public.criteria enable row level security;
alter table public.recommendations enable row level security;
alter table public.recommendation_sources enable row level security;
alter table public.ai_requests enable row level security;
alter table public.budget_reservations enable row level security;
alter table public.exports enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "conversations_owner_all" on public.conversations
  for all to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "messages_select_own_conversations" on public.messages
  for select to authenticated using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.owner_id = (select auth.uid())
    )
  );
create policy "messages_insert_user_message" on public.messages
  for insert to authenticated with check (
    role = 'user' and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.owner_id = (select auth.uid())
    )
  );

create policy "requirements_select_own_conversations" on public.requirements
  for select to authenticated using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.owner_id = (select auth.uid())
    )
  );
create policy "requirements_insert_own_conversations" on public.requirements
  for insert to authenticated with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.owner_id = (select auth.uid())
    )
  );

create policy "verified_sources_read" on public.sources
  for select to authenticated using (status = 'verified');
create policy "verified_chunks_read" on public.chunks
  for select to authenticated using (
    exists (
      select 1 from public.sources s
      where s.id = source_id and s.status = 'verified'
    )
  );
create policy "documented_services_read" on public.cloud_services
  for select to authenticated using (
    is_fixture = false and exists (
      select 1 from public.sources s
      where s.id = source_id and s.status = 'verified'
    )
  );
create policy "criteria_read" on public.criteria
  for select to authenticated using (is_fixture = false);

create policy "recommendations_select_own" on public.recommendations
  for select to authenticated using (
    exists (
      select 1 from public.requirements r
      join public.conversations c on c.id = r.conversation_id
      where r.id = requirement_id and c.owner_id = (select auth.uid())
    )
  );
create policy "recommendation_sources_select_own" on public.recommendation_sources
  for select to authenticated using (
    exists (
      select 1 from public.recommendations rec
      join public.requirements r on r.id = rec.requirement_id
      join public.conversations c on c.id = r.conversation_id
      where rec.id = recommendation_id and c.owner_id = (select auth.uid())
    )
  );
create policy "exports_select_own" on public.exports
  for select to authenticated using (
    owner_id = (select auth.uid()) and exists (
      select 1 from public.recommendations rec
      join public.requirements r on r.id = rec.requirement_id
      join public.conversations c on c.id = r.conversation_id
      where rec.id = recommendation_id and c.owner_id = (select auth.uid())
    )
  );

-- User files and knowledge files remain private. No client write policy is granted;
-- backend operations must validate ownership before issuing temporary download links.
insert into storage.buckets (id, name, public)
values ('recommendation-exports', 'recommendation-exports', false),
       ('knowledge-sources', 'knowledge-sources', false)
on conflict (id) do update set public = excluded.public;

create policy "owners_read_exports" on storage.objects
  for select to authenticated using (
    bucket_id = 'recommendation-exports'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

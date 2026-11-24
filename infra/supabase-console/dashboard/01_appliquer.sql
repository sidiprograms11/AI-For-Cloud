-- Fichier généré par infra/prepare_console_dashboard.py ; ne pas modifier.
-- Cible autorisée : IA FOR CLOUD (qxgingqrkzzqccsluntb).
-- Coller TOUT ce fichier dans SQL Editor, rôle postgres, et lancer une fois.
-- Exécute la migration versionnée sans la modifier et enregistre son historique.
begin;
set local lock_timeout = '10s';
set local statement_timeout = '120s';

do $kora_deploiement$
declare
  v_sql text := $kora_source$
-- Contributions de l'équipe. Aucun accès direct aux tables depuis le navigateur.
create table public.workspace_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('source', 'criterion', 'prompt', 'reference', 'feedback', 'check')),
  provider text not null default 'multi' check (provider in ('aws', 'azure', 'gcp', 'multi')),
  title text not null check (length(trim(title)) between 3 and 160),
  content text not null check (length(trim(content)) between 5 and 60000),
  url text not null default '',
  metadata jsonb not null default '{}' check (jsonb_typeof(metadata) = 'object'),
  revision integer not null default 1,
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'archived')),
  created_by uuid not null references auth.users(id),
  modified_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  search_text tsvector generated always as
    (to_tsvector('french'::regconfig, title || ' ' || content)) stored
);
create index workspace_items_kind_updated_idx on public.workspace_items(kind, updated_at desc);
create index workspace_items_search_idx on public.workspace_items using gin(search_text);

create table public.workspace_item_history (
  item_id uuid not null references public.workspace_items(id),
  revision integer not null,
  snapshot jsonb not null,
  author_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key(item_id, revision)
);

create table public.workspace_releases (
  id uuid primary key default gen_random_uuid(),
  version bigint generated always as identity unique,
  title text not null check (length(trim(title)) between 3 and 160),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  status text not null default 'draft'
    check (status in ('draft', 'tested', 'reviewed', 'active', 'superseded')),
  created_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  published_at timestamptz
);

create table public.workspace_active_configuration (
  singleton boolean primary key default true check(singleton),
  release_id uuid not null references public.workspace_releases(id),
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);

create table public.workspace_experiments (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.workspace_releases(id),
  question text not null check(length(trim(question)) between 3 and 2000),
  status text not null default 'simulated' check(status = 'simulated'),
  result jsonb not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index workspace_experiments_release_idx on public.workspace_experiments(release_id, created_at desc);

create table public.workspace_evaluations (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.workspace_experiments(id),
  usefulness integer not null check(usefulness between 1 and 5),
  grounding integer not null check(grounding between 1 and 5),
  notes text not null check(length(trim(notes)) between 5 and 4000),
  author_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.workspace_events (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null,
  action text not null,
  actor_id uuid not null references auth.users(id),
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index workspace_events_created_idx on public.workspace_events(created_at desc);

alter table public.workspace_items enable row level security;
alter table public.workspace_item_history enable row level security;
alter table public.workspace_releases enable row level security;
alter table public.workspace_active_configuration enable row level security;
alter table public.workspace_experiments enable row level security;
alter table public.workspace_evaluations enable row level security;
alter table public.workspace_events enable row level security;
revoke all on public.workspace_items, public.workspace_item_history, public.workspace_releases,
  public.workspace_active_configuration, public.workspace_experiments, public.workspace_evaluations,
  public.workspace_events from public, anon, authenticated;
grant all on public.workspace_items, public.workspace_item_history, public.workspace_releases,
  public.workspace_active_configuration, public.workspace_experiments, public.workspace_evaluations,
  public.workspace_events to service_role;

create function public.workspace_api(p_action text, p_id uuid default null, p_payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_item public.workspace_items%rowtype;
  v_release public.workspace_releases%rowtype;
  v_experiment public.workspace_experiments%rowtype;
  v_kind text;
  v_provider text;
  v_title text;
  v_content text;
  v_url text;
  v_metadata jsonb;
  v_result jsonb;
  v_history jsonb;
  v_prompt public.workspace_items%rowtype;
  v_sources jsonb;
  v_source_ids uuid[];
  v_question text;
  v_query tsquery;
  v_id uuid;
  v_previous uuid;
  v_start timestamptz := clock_timestamp();
begin
  if v_actor is null then raise sqlstate 'PT401' using message = 'Connexion requise.'; end if;
  select role into v_role from public.internal_members where user_id = v_actor for share;
  if v_role is null then raise sqlstate 'PT403' using message = 'Accès interne refusé.'; end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object'
      or octet_length(p_payload::text) > 250000 then
    raise sqlstate 'PT422' using message = 'Données invalides ou trop volumineuses.';
  end if;

  if p_action = 'overview' then
    return jsonb_build_object(
      'items', coalesce((select jsonb_agg(doc order by updated_at desc) from (
        select to_jsonb(i) - 'content' - 'search_text' doc, updated_at
        from public.workspace_items i order by updated_at desc limit 500) rows), '[]'::jsonb),
      'releases', coalesce((select jsonb_agg(doc order by version desc) from (
        select to_jsonb(r) - 'snapshot' || jsonb_build_object(
          'source_count', jsonb_array_length(r.snapshot->'sources'),
          'prompt_title', r.snapshot->'prompt'->>'title') doc, version
        from public.workspace_releases r order by version desc limit 50) rows), '[]'::jsonb),
      'experiments', coalesce((select jsonb_agg(doc order by created_at desc) from (
        select to_jsonb(e) - 'result' || jsonb_build_object(
          'source_count', jsonb_array_length(e.result->'sources')) doc, created_at
        from public.workspace_experiments e order by created_at desc limit 100) rows), '[]'::jsonb),
      'evaluations', coalesce((select jsonb_agg(to_jsonb(e) order by created_at desc)
        from (select * from public.workspace_evaluations order by created_at desc limit 200) e), '[]'::jsonb),
      'events', coalesce((select jsonb_agg(to_jsonb(e) order by created_at desc)
        from (select * from public.workspace_events order by created_at desc limit 100) e), '[]'::jsonb),
      'active_release_id', (select release_id from public.workspace_active_configuration where singleton),
      'capabilities', jsonb_build_object('generation', false, 'embeddings', false,
        'fine_tuning', false, 'lexical_search', true, 'max_items', 500)
    );
  elsif p_action = 'get_item' then
    select * into v_item from public.workspace_items where id = p_id;
    if not found then raise sqlstate 'PT404' using message = 'Contribution introuvable.'; end if;
    select coalesce(jsonb_agg(to_jsonb(h) order by revision desc), '[]'::jsonb) into v_history
      from (select * from public.workspace_item_history where item_id = p_id
        order by revision desc limit 20) h;
    return (to_jsonb(v_item) - 'search_text') || jsonb_build_object('history', v_history);
  elsif p_action = 'save_item' then
    v_kind := p_payload->>'kind';
    v_provider := coalesce(p_payload->>'provider', 'multi');
    v_title := trim(p_payload->>'title');
    v_content := trim(p_payload->>'content');
    v_url := trim(coalesce(p_payload->>'url', ''));
    v_metadata := coalesce(p_payload->'metadata', '{}'::jsonb);
    if v_kind is null or v_kind not in ('source', 'criterion', 'prompt', 'reference', 'feedback', 'check')
      or v_provider not in ('aws', 'azure', 'gcp', 'multi')
      or jsonb_typeof(p_payload->'title') is distinct from 'string'
      or length(v_title) not between 3 and 160
      or jsonb_typeof(p_payload->'content') is distinct from 'string'
      or length(v_content) not between 5 and 60000
      or length(v_url) > 2000 or (v_url <> '' and v_url !~ '^https?://[^[:space:]]+$')
      or jsonb_typeof(v_metadata) <> 'object' or octet_length(v_metadata::text) > 12000 then
      raise sqlstate 'PT422' using message = 'Titre, contenu, fournisseur ou référence invalide.';
    end if;
    if v_kind = 'source' and coalesce(v_metadata->>'origin', '') not in ('official', 'team', 'notes') then
      raise sqlstate 'PT422' using message = 'Précise la provenance du contenu cloud.';
    end if;
    if v_kind = 'source' and v_metadata->>'origin' = 'official' and v_url = '' then
      raise sqlstate 'PT422' using message = 'Une source officielle exige une URL.';
    end if;
    if v_kind = 'reference' and (length(trim(coalesce(v_metadata->>'question', ''))) not between 3 and 2000) then
      raise sqlstate 'PT422' using message = 'Une question de référence est requise.';
    end if;
    if v_kind in ('feedback', 'check') and coalesce(v_metadata->>'progress', 'open') not in
        ('open', 'in_progress', 'resolved', 'not_run', 'passed', 'failed') then
      raise sqlstate 'PT422' using message = 'État de suivi invalide.';
    end if;
    if p_id is null then
      perform pg_advisory_xact_lock(982731);
      if (select count(*) from public.workspace_items) >= 500 then
        raise sqlstate 'PT429' using message = 'Limite de 500 contributions atteinte pour ce lot.';
      end if;
      insert into public.workspace_items(kind, provider, title, content, url, metadata, created_by, modified_by)
      values(v_kind, v_provider, v_title, v_content, v_url, v_metadata, v_actor, v_actor)
      returning * into v_item;
    else
      select * into v_item from public.workspace_items where id = p_id for update;
      if not found then raise sqlstate 'PT404' using message = 'Contribution introuvable.'; end if;
      if v_item.kind <> v_kind or coalesce(p_payload->>'expected_revision', '') <> v_item.revision::text then
        raise sqlstate 'PT409' using message = 'Contribution modifiée entre-temps ; recharge-la.';
      end if;
      update public.workspace_items set provider = v_provider, title = v_title, content = v_content,
        url = v_url, metadata = v_metadata, revision = revision + 1, status = 'draft', modified_by = v_actor,
        updated_at = now(), reviewed_by = null, reviewed_at = null where id = p_id returning * into v_item;
    end if;
    insert into public.workspace_item_history(item_id, revision, snapshot, author_id)
      values(v_item.id, v_item.revision, to_jsonb(v_item) - 'search_text', v_actor);
    insert into public.workspace_events(resource_id, action, actor_id, details)
      values(v_item.id, 'item_saved', v_actor, jsonb_build_object('kind', v_kind, 'revision', v_item.revision));
    return to_jsonb(v_item) - 'search_text';
  elsif p_action in ('review_item', 'archive_item') then
    select * into v_item from public.workspace_items where id = p_id for update;
    if not found then raise sqlstate 'PT404' using message = 'Contribution introuvable.'; end if;
    if coalesce(p_payload->>'expected_revision', '') <> v_item.revision::text then
      raise sqlstate 'PT409' using message = 'La contribution a changé ; recharge-la.';
    end if;
    if p_action = 'review_item' then
      if v_role not in ('reviewer', 'publisher') or v_item.created_by = v_actor or v_item.modified_by = v_actor then
        raise sqlstate 'PT403' using message = 'Une autre personne autorisée doit relire cette contribution.';
      end if;
      if v_item.status <> 'draft' then raise sqlstate 'PT409' using message = 'Un brouillon est requis.'; end if;
      update public.workspace_items set status = 'reviewed', reviewed_by = v_actor, reviewed_at = now()
        where id = p_id returning * into v_item;
    else
      if v_role <> 'publisher' then raise sqlstate 'PT403' using message = 'Droit de publication requis pour archiver.'; end if;
      update public.workspace_items set status = 'archived', updated_at = now()
        where id = p_id returning * into v_item;
    end if;
    insert into public.workspace_events(resource_id, action, actor_id) values(p_id, p_action, v_actor);
    return to_jsonb(v_item) - 'search_text';
  elsif p_action = 'search_sources' then
    v_question := trim(p_payload->>'query');
    if v_question is null or length(v_question) not between 2 and 2000 then
      raise sqlstate 'PT422' using message = 'Recherche attendue : 2 à 2 000 caractères.';
    end if;
    v_query := websearch_to_tsquery('french'::regconfig, v_question);
    select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) into v_result from (
      select id, title, provider, url, revision, status,
        ts_headline('french'::regconfig, content, v_query,
          'StartSel=[, StopSel=], MaxWords=90, MinWords=25') excerpt
      from public.workspace_items where kind = 'source' and status <> 'archived'
        and (coalesce(p_payload->>'provider', 'multi') = 'multi' or provider = p_payload->>'provider')
        and search_text @@ v_query order by ts_rank(search_text, v_query) desc limit 10
    ) s;
    return v_result;
  elsif p_action = 'prepare_release' then
    v_title := trim(p_payload->>'title');
    if v_title is null or length(v_title) not between 3 and 160
      or jsonb_typeof(p_payload->'source_ids') is distinct from 'array'
      or jsonb_array_length(p_payload->'source_ids') not between 1 and 20 then
      raise sqlstate 'PT422' using message = 'Titre et sélection de 1 à 20 sources requis.';
    end if;
    begin
      select array_agg(value::uuid) into v_source_ids from jsonb_array_elements_text(p_payload->'source_ids');
      select * into v_prompt from public.workspace_items where id = (p_payload->>'prompt_id')::uuid
        and kind = 'prompt' and status <> 'archived' for share;
    exception when invalid_text_representation then
      raise sqlstate 'PT422' using message = 'Identifiants de configuration invalides.';
    end;
    if v_prompt.id is null then raise sqlstate 'PT422' using message = 'Consignes enregistrées requises.'; end if;
    perform 1 from public.workspace_items where id = any(v_source_ids) for share;
    select jsonb_agg(to_jsonb(s) - 'search_text' order by s.id) into v_sources
      from public.workspace_items s where id = any(v_source_ids) and kind = 'source' and status <> 'archived';
    if coalesce(jsonb_array_length(v_sources), 0) <> cardinality(v_source_ids) then
      raise sqlstate 'PT422' using message = 'Sélection de sources invalide ou archivée.';
    end if;
    insert into public.workspace_releases(title, snapshot, created_by)
      values(v_title, jsonb_build_object('prompt', to_jsonb(v_prompt) - 'search_text', 'sources', v_sources,
        'mode', 'simulation', 'retrieval', 'lexical', 'llm_model', null, 'embedding_model', null), v_actor)
      returning * into v_release;
    insert into public.workspace_events(resource_id, action, actor_id) values(v_release.id, p_action, v_actor);
    return to_jsonb(v_release);
  elsif p_action = 'get_release' then
    select * into v_release from public.workspace_releases where id = p_id;
    if not found then raise sqlstate 'PT404' using message = 'Configuration introuvable.'; end if;
    return to_jsonb(v_release);
  elsif p_action = 'run_experiment' then
    select * into v_release from public.workspace_releases where id = p_id for update;
    if not found then raise sqlstate 'PT404' using message = 'Configuration introuvable.'; end if;
    v_question := trim(p_payload->>'question');
    if v_question is null or length(v_question) not between 3 and 2000 then
      raise sqlstate 'PT422' using message = 'Question attendue : 3 à 2 000 caractères.';
    end if;
    if (select count(*) from public.workspace_experiments where release_id = p_id) >= 100 then
      raise sqlstate 'PT429' using message = 'Limite de 100 expériences par configuration atteinte.';
    end if;
    v_query := websearch_to_tsquery('french'::regconfig, v_question);
    select coalesce(jsonb_agg(doc), '[]'::jsonb) into v_sources from (
      select jsonb_build_object('id', s->>'id', 'title', s->>'title', 'provider', s->>'provider',
        'url', s->>'url', 'revision', s->'revision', 'status', s->>'status',
        'excerpt', left(ts_headline('french'::regconfig, s->>'content', v_query,
          'StartSel=[, StopSel=], MaxWords=110, MinWords=25'), 2000)) doc
      from jsonb_array_elements(v_release.snapshot->'sources') s
      where to_tsvector('french'::regconfig, (s->>'title') || ' ' || (s->>'content')) @@ v_query
      order by ts_rank(to_tsvector('french'::regconfig, (s->>'title') || ' ' || (s->>'content')), v_query) desc limit 3
    ) matches;
    v_result := jsonb_build_object('mode', 'simulation', 'retrieval', 'lexical',
      'message', 'Simulation de préparation du contexte : aucun modèle IA ne génère de réponse.',
      'sources', v_sources, 'instructions', v_release.snapshot->'prompt',
      'release_id', p_id, 'release_version', v_release.version,
      'hypotheses', jsonb_build_array('Les contenus sont des contributions à relire, pas une preuve automatique.',
        'Aucun embedding, entraînement de modèle, service cloud ou coût n’est calculé.'),
      'duration_ms', round(extract(epoch from clock_timestamp() - v_start) * 1000),
      'input_tokens', null, 'output_tokens', null, 'estimated_cost', null);
    insert into public.workspace_experiments(release_id, question, result, created_by)
      values(p_id, v_question, v_result, v_actor) returning * into v_experiment;
    if v_release.status = 'draft' then update public.workspace_releases set status = 'tested' where id = p_id; end if;
    insert into public.workspace_events(resource_id, action, actor_id, details)
      values(v_experiment.id, p_action, v_actor, jsonb_build_object('release_id', p_id));
    return to_jsonb(v_experiment);
  elsif p_action = 'get_experiment' then
    select * into v_experiment from public.workspace_experiments where id = p_id;
    if not found then raise sqlstate 'PT404' using message = 'Expérience introuvable.'; end if;
    return to_jsonb(v_experiment);
  elsif p_action = 'evaluate' then
    if not exists(select 1 from public.workspace_experiments where id = p_id) then
      raise sqlstate 'PT404' using message = 'Expérience introuvable.';
    end if;
    if coalesce(p_payload->>'usefulness', '') !~ '^[1-5]$' or coalesce(p_payload->>'grounding', '') !~ '^[1-5]$'
      or length(trim(coalesce(p_payload->>'notes', ''))) not between 5 and 4000 then
      raise sqlstate 'PT422' using message = 'Deux notes de 1 à 5 et un commentaire sont requis.';
    end if;
    insert into public.workspace_evaluations(experiment_id, usefulness, grounding, notes, author_id)
      values(p_id, (p_payload->>'usefulness')::integer, (p_payload->>'grounding')::integer,
        trim(p_payload->>'notes'), v_actor) returning to_jsonb(workspace_evaluations.*) into v_result;
    insert into public.workspace_events(resource_id, action, actor_id, details)
      values((v_result->>'id')::uuid, p_action, v_actor, jsonb_build_object('experiment_id', p_id));
    return v_result;
  elsif p_action in ('approve_release', 'activate_release', 'rollback_release') then
    perform pg_advisory_xact_lock(982732);
    select * into v_release from public.workspace_releases where id = p_id for update;
    if not found then raise sqlstate 'PT404' using message = 'Configuration introuvable.'; end if;
    if p_action = 'approve_release' then
      if v_role not in ('reviewer', 'publisher') or v_release.created_by = v_actor then
        raise sqlstate 'PT403' using message = 'Une autre personne autorisée doit valider cette configuration.';
      end if;
      if v_release.status <> 'tested' then raise sqlstate 'PT409' using message = 'Un test est requis avant validation.'; end if;
      if exists(select 1 from jsonb_array_elements((v_release.snapshot->'sources') ||
          jsonb_build_array(v_release.snapshot->'prompt')) s
        left join public.workspace_items i on i.id = (s->>'id')::uuid
        where i.id is null or i.status <> 'reviewed' or i.revision <> (s->>'revision')::integer) then
        raise sqlstate 'PT409' using message = 'Toutes les révisions sélectionnées doivent être relues et à jour.';
      end if;
      update public.workspace_releases set status = 'reviewed', reviewed_by = v_actor, reviewed_at = now()
        where id = p_id returning * into v_release;
    else
      if v_role <> 'publisher' then raise sqlstate 'PT403' using message = 'Droit de publication requis.'; end if;
      if (p_action = 'activate_release' and v_release.status <> 'reviewed') or
        (p_action = 'rollback_release' and (v_release.status <> 'superseded' or v_release.published_at is null)) then
        raise sqlstate 'PT409' using message = 'Configuration non validée ou non publiée précédemment.';
      end if;
      select release_id into v_previous from public.workspace_active_configuration where singleton;
      if v_previous is not null then update public.workspace_releases set status = 'superseded' where id = v_previous; end if;
      update public.workspace_releases set status = 'active', published_at = now() where id = p_id returning * into v_release;
      insert into public.workspace_active_configuration(singleton, release_id, updated_by)
        values(true, p_id, v_actor) on conflict(singleton) do update
        set release_id = excluded.release_id, updated_by = excluded.updated_by, updated_at = now();
    end if;
    insert into public.workspace_events(resource_id, action, actor_id, details)
      values(p_id, p_action, v_actor, jsonb_build_object('previous_release_id', v_previous));
    return to_jsonb(v_release);
  end if;
  raise sqlstate 'PT404' using message = 'Opération introuvable.';
end;
$$;
revoke all on function public.workspace_api(text, uuid, jsonb) from public, anon;
grant execute on function public.workspace_api(text, uuid, jsonb) to authenticated;
$kora_source$;
begin
  perform pg_advisory_xact_lock(20261117160000::bigint);
  if to_regclass('supabase_migrations.schema_migrations') is null
     or to_regclass('public.internal_members') is null
     or to_regprocedure('public.console_api(text,uuid,uuid,jsonb)') is null then
    raise exception 'Socle initial absent. Arrêter et transmettre le résultat de 00_verifier.sql.';
  end if;
  if (select count(*) from supabase_migrations.schema_migrations
      where version in ('20261113000000', '20261117000000', '20261117140000')) <> 3 then
    raise exception 'Historique initial inattendu. Arrêter et transmettre le résultat de 00_verifier.sql.';
  end if;
  if exists(select 1 from supabase_migrations.schema_migrations where version = '20261117160000') then
    raise exception 'Migration déjà enregistrée. Ne pas la rejouer ; utiliser 02_controler.sql.';
  end if;
  if exists(select 1 from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname in ('workspace_items', 'workspace_item_history', 'workspace_releases', 'workspace_active_configuration', 'workspace_experiments', 'workspace_evaluations', 'workspace_events'))
      or to_regprocedure('public.workspace_api(text,uuid,jsonb)') is not null then
    raise exception 'Des objets atelier existent sans historique correspondant. Arrêter sans les supprimer.';
  end if;

  execute v_sql;
  insert into supabase_migrations.schema_migrations(version, name, statements)
    values ('20261117160000', 'console_workspaces', array[v_sql]);
end;
$kora_deploiement$;

notify pgrst, 'reload schema';
commit;
select 'Migration 20261117160000 appliquée et enregistrée.' as resultat;

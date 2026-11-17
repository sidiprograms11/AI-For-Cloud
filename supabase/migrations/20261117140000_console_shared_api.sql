-- API commune à FastAPI et à l'Edge Function : droits et transitions atomiques.
alter table public.internal_case_versions
  add column modified_by uuid references auth.users (id);

create function public.console_case_document(p_case_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select to_jsonb(c) || jsonb_build_object(
    'versions', coalesce((select jsonb_agg(to_jsonb(v) order by v.version_no desc)
      from public.internal_case_versions v where v.case_id = c.id), '[]'::jsonb),
    'tests', coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at desc)
      from public.internal_case_tests t join public.internal_case_versions v
      on v.id = t.case_version_id where v.case_id = c.id), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(to_jsonb(e) order by e.created_at desc)
      from public.internal_case_events e where e.case_id = c.id), '[]'::jsonb)
  ) from public.internal_cases c where c.id = p_case_id;
$$;
revoke all on function public.console_case_document(uuid) from public, anon, authenticated;
grant execute on function public.console_case_document(uuid) to service_role;

create function public.console_api(
  p_action text, p_case_id uuid default null, p_version_id uuid default null,
  p_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_case public.internal_cases%rowtype;
  v_version public.internal_case_versions%rowtype;
  v_test public.internal_case_tests%rowtype;
  v_constraints jsonb;
  v_field text;
  v_value jsonb;
  v_title text;
  v_context text;
  v_missing jsonb := '[]'::jsonb;
  v_id uuid;
  v_result jsonb;
begin
  if v_actor is null then raise sqlstate 'PT401' using message = 'Connexion requise.'; end if;
  select role into v_role from public.internal_members where user_id = v_actor for share;
  if v_role is null then raise sqlstate 'PT403' using message = 'Accès interne refusé.'; end if;
  if p_action = 'me' then
    return jsonb_build_object('user_id', v_actor, 'role', v_role);
  end if;
  if p_action = 'list' then
    select coalesce(jsonb_agg(row_data order by created_at desc), '[]'::jsonb) into v_result
    from (select c.created_at, to_jsonb(c) || jsonb_build_object('versions',
      coalesce((select jsonb_agg(to_jsonb(v) order by v.version_no desc)
      from public.internal_case_versions v where v.case_id = c.id), '[]'::jsonb)) row_data
      from public.internal_cases c order by c.created_at desc limit 100) items;
    return v_result;
  end if;
  if p_action is null or p_action not in ('get', 'create', 'edit', 'draft', 'test', 'submit-review',
      'approve', 'publish', 'rollback') then
    raise sqlstate 'PT404' using message = 'Opération introuvable.';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object'
      or octet_length(p_payload::text) > 16000 then
    raise sqlstate 'PT422' using message = 'Données invalides ou trop volumineuses.';
  end if;
  if p_action in ('create', 'edit') then
    v_title := trim(p_payload->>'title');
    v_context := trim(p_payload->>'company_context');
    if jsonb_typeof(p_payload->'title') is distinct from 'string'
        or jsonb_typeof(p_payload->'company_context') is distinct from 'string'
        or v_title is null or length(v_title) not between 3 and 160 or v_context is null
        or length(v_context) not between 10 and 4000 then
      raise sqlstate 'PT422' using message = 'Titre ou contexte invalide.';
    end if;
    foreach v_field in array array['blocking_constraints', 'preferences'] loop
      v_value := coalesce(p_payload->v_field, '[]'::jsonb);
      if jsonb_typeof(v_value) <> 'array' then
        raise sqlstate 'PT422' using message = 'Une liste de contraintes est attendue.';
      end if;
      if jsonb_array_length(v_value) > 12 or exists (
        select 1 from jsonb_array_elements(v_value) e
        where jsonb_typeof(e) <> 'string' or length(trim(e #>> '{}')) not between 1 and 240
      ) then raise sqlstate 'PT422' using message = 'Contraintes invalides.'; end if;
    end loop;
    if length(coalesce(p_payload->>'data_region', '')) > 120
        or length(coalesce(p_payload->>'budget_context', '')) > 240 then
      raise sqlstate 'PT422' using message = 'Région ou budget trop long.';
    end if;
    v_constraints := jsonb_build_object(
      'blocking', coalesce(p_payload->'blocking_constraints', '[]'::jsonb),
      'preferences', coalesce(p_payload->'preferences', '[]'::jsonb),
      'data_region', coalesce(p_payload->>'data_region', ''),
      'budget_context', coalesce(p_payload->>'budget_context', '')
    );
  end if;
  if p_action = 'create' then
    v_id := public.create_internal_case(v_title, v_context, v_constraints, v_actor);
    return public.console_case_document(v_id);
  end if;
  -- Une même transaction sérialise les mutations du cas, du test et de la trace.
  select * into v_case from public.internal_cases where id = p_case_id for update;
  if not found then raise sqlstate 'PT404' using message = 'Cas introuvable.'; end if;
  if p_action = 'get' then return public.console_case_document(p_case_id); end if;
  if p_action = 'draft' then
    if v_case.active_version_id is null or exists (
      select 1 from public.internal_case_versions where case_id = p_case_id
      and state in ('draft', 'tested', 'in_review', 'reviewed')
    ) then raise sqlstate 'PT409' using message = 'Un brouillon existe ou aucune version active.'; end if;
    v_id := public.create_internal_case_draft(p_case_id, v_actor);
    select to_jsonb(v) into v_result from public.internal_case_versions v where id = v_id;
    return v_result;
  end if;
  select * into v_version from public.internal_case_versions
  where id = p_version_id and case_id = p_case_id for update;
  if not found then raise sqlstate 'PT404' using message = 'Version introuvable.'; end if;
  if p_action = 'edit' then
    if v_version.state not in ('draft', 'tested') or
        coalesce(p_payload->>'expected_revision', '') <> v_version.revision::text then
      raise sqlstate 'PT409' using message = 'Brouillon modifié ou non modifiable ; rechargez-le.';
    end if;
    update public.internal_case_versions set title = v_title, company_context = v_context,
      constraints = v_constraints, revision = revision + 1, state = 'draft', modified_by = v_actor
      where id = p_version_id returning * into v_version;
  elsif p_action = 'test' then
    if v_version.state not in ('draft', 'tested') then
      raise sqlstate 'PT409' using message = 'Un brouillon modifiable est requis.';
    end if;
    if (select count(*) from public.internal_case_tests where case_version_id = p_version_id
        and version_revision = v_version.revision) >= 10 then
      raise sqlstate 'PT429' using message = 'Limite de dix tests par révision atteinte.';
    end if;
    foreach v_field in array array['blocking', 'data_region', 'budget_context'] loop
      if coalesce(v_version.constraints->v_field, 'null'::jsonb) in ('null', '[]', '""') then
        v_missing := v_missing || jsonb_build_array(case v_field
          when 'blocking' then 'Contraintes bloquantes'
          when 'data_region' then 'Région des données' else 'Contexte budgétaire' end);
      end if;
    end loop;
    insert into public.internal_case_tests
      (case_version_id, version_revision, run_by, status, result, configuration)
    values (p_version_id, v_version.revision, v_actor, 'simulated', jsonb_build_object(
      'mode', 'simulation',
      'message', '[SIMULATION IA — aucune recommandation cloud réelle n’a été générée.]',
      'missing_information', v_missing,
      'hypotheses', jsonb_build_array(
        'Aucune source cloud ni règle de comparaison validée n’est chargée pour ce test.',
        'Aucun coût ou service AWS, Azure ou Google Cloud n’est calculé.'),
      'provider_comparison', null), jsonb_build_object(
      'llm_adapter', 'mock', 'comparison_rules', 'non_configured',
      'case_version_id', p_version_id, 'case_revision', v_version.revision))
    returning * into v_test;
    update public.internal_case_versions set state = 'tested' where id = p_version_id;
  elsif p_action = 'submit-review' then
    if v_version.state <> 'tested' or not exists (
      select 1 from public.internal_case_tests where case_version_id = p_version_id
      and version_revision = v_version.revision
    ) then raise sqlstate 'PT409' using message = 'Un test à jour est requis.'; end if;
    update public.internal_case_versions set state = 'in_review'
      where id = p_version_id returning * into v_version;
  elsif p_action = 'approve' then
    if v_role not in ('reviewer', 'publisher') or v_version.created_by = v_actor
        or v_version.modified_by = v_actor then
      raise sqlstate 'PT403' using message = 'Une autre personne autorisée doit relire ce cas.';
    end if;
    if v_version.state <> 'in_review' then
      raise sqlstate 'PT409' using message = 'La version n’est pas en relecture.';
    end if;
    update public.internal_case_versions set state = 'reviewed', reviewed_by = v_actor,
      reviewed_at = now() where id = p_version_id returning * into v_version;
  elsif p_action in ('publish', 'rollback') then
    if v_role <> 'publisher' then
      raise sqlstate 'PT403' using message = 'Droit de publication requis.';
    end if;
    if (p_action = 'publish' and v_version.state <> 'reviewed') or
        (p_action = 'rollback' and (v_version.state <> 'superseded' or v_version.published_at is null)) then
      raise sqlstate 'PT409' using message = 'État de version incompatible avec cette action.';
    end if;
    perform public.activate_internal_case_version(p_case_id, p_version_id, v_actor, p_action = 'rollback');
    return public.console_case_document(p_case_id);
  end if;
  insert into public.internal_case_events (case_id, case_version_id, action, actor_id)
  values (p_case_id, p_version_id, case p_action when 'edit' then 'draft_updated'
    when 'test' then 'test_simulated' when 'approve' then 'reviewed'
    else 'submitted_for_review' end, v_actor);
  if p_action = 'test' then return to_jsonb(v_test); end if;
  return to_jsonb(v_version);
end;
$$;
revoke all on function public.console_api(text, uuid, uuid, jsonb) from public, anon;
grant execute on function public.console_api(text, uuid, uuid, jsonb) to authenticated;

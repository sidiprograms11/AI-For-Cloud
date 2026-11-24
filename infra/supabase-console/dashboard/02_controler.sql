-- Contrôle en lecture seule dans SQL Editor, rôle postgres.
-- Ce contrôle vérifie PostgreSQL, pas le déploiement de l'Edge Function.
begin;

select version, name
from supabase_migrations.schema_migrations
where version = '20261117160000';

select c.relname as table_atelier, c.relrowsecurity as rls_active,
       not has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE')
           as aucun_acces_direct_anon,
       not has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE')
           as aucun_acces_direct_connecte
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('workspace_items', 'workspace_item_history', 'workspace_releases', 'workspace_active_configuration', 'workspace_experiments', 'workspace_evaluations', 'workspace_events')
order by c.relname;

select has_function_privilege('authenticated',
         'public.workspace_api(text,uuid,jsonb)', 'EXECUTE') as rpc_connecte_autorise,
       not has_function_privilege('anon',
         'public.workspace_api(text,uuid,jsonb)', 'EXECUTE') as rpc_anonyme_refuse;

-- Le SQL Editor n'a pas de session utilisateur de la console.
-- Emprunt LOCAL de l'identité du compte existant pour ce contrôle administrateur.
do $kora_compte$
begin
  if not exists(select 1 from auth.users u
      join public.internal_members m on m.user_id = u.id
      where lower(u.email) = 'sidi.gano@efrei.net') then
    raise exception 'Compte ou rôle interne absent : transmettre le résultat de 00_verifier.sql.';
  end if;
end;
$kora_compte$;

select set_config('request.jwt.claim.sub', u.id::text, true) as compte_controle
from auth.users u where lower(u.email) = 'sidi.gano@efrei.net';
set local role authenticated;

select public.workspace_api('overview', null, '{}'::jsonb)->'capabilities'
       as capacites_ateliers;

-- Annule le contexte temporaire. Aucune contribution n'est créée ou modifiée.
rollback;

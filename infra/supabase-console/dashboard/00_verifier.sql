-- IA FOR CLOUD uniquement : qxgingqrkzzqccsluntb.
-- SQL Editor, rôle postgres. Ce fichier ne modifie aucune donnée.
select version, name
from supabase_migrations.schema_migrations
order by version;

select to_regclass('public.internal_members') as membres_existants,
       to_regclass('public.workspace_items') as ateliers_existants,
       to_regprocedure('public.workspace_api(text,uuid,jsonb)') as api_ateliers;

select u.email, m.role
from auth.users u
left join public.internal_members m on m.user_id = u.id
where lower(u.email) = 'sidi.gano@efrei.net';

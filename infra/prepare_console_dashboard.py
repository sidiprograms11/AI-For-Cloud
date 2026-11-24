"""Prépare les fichiers à copier dans le Dashboard, sans connexion distante."""

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "infra/supabase-console/dashboard"
VERSION = "20261117160000"
MIGRATION = ROOT / f"supabase/migrations/{VERSION}_console_workspaces.sql"
TABLES = (
    "workspace_items", "workspace_item_history", "workspace_releases",
    "workspace_active_configuration", "workspace_experiments",
    "workspace_evaluations", "workspace_events",
)


def prepare():
    source = MIGRATION.read_text(encoding="utf-8").strip()
    table_list = ", ".join(f"'{name}'" for name in TABLES)
    before = """-- IA FOR CLOUD uniquement : qxgingqrkzzqccsluntb.
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
"""
    apply = f"""-- Fichier généré par infra/prepare_console_dashboard.py ; ne pas modifier.
-- Cible autorisée : IA FOR CLOUD (qxgingqrkzzqccsluntb).
-- Coller TOUT ce fichier dans SQL Editor, rôle postgres, et lancer une fois.
-- Exécute la migration versionnée sans la modifier et enregistre son historique.
begin;
set local lock_timeout = '10s';
set local statement_timeout = '120s';

do $kora_deploiement$
declare
  v_sql text := $kora_source$
{source}
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
  if exists(select 1 from supabase_migrations.schema_migrations where version = '{VERSION}') then
    raise exception 'Migration déjà enregistrée. Ne pas la rejouer ; utiliser 02_controler.sql.';
  end if;
  if exists(select 1 from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname in ({table_list}))
      or to_regprocedure('public.workspace_api(text,uuid,jsonb)') is not null then
    raise exception 'Des objets atelier existent sans historique correspondant. Arrêter sans les supprimer.';
  end if;

  execute v_sql;
  insert into supabase_migrations.schema_migrations(version, name, statements)
    values ('{VERSION}', 'console_workspaces', array[v_sql]);
end;
$kora_deploiement$;

notify pgrst, 'reload schema';
commit;
select 'Migration 20261117160000 appliquée et enregistrée.' as resultat;
"""
    after = f"""-- Contrôle en lecture seule dans SQL Editor, rôle postgres.
-- Ce contrôle vérifie PostgreSQL, pas le déploiement de l'Edge Function.
begin;

select version, name
from supabase_migrations.schema_migrations
where version = '{VERSION}';

select c.relname as table_atelier, c.relrowsecurity as rls_active,
       not has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE')
           as aucun_acces_direct_anon,
       not has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE')
           as aucun_acces_direct_connecte
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ({table_list})
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

select public.workspace_api('overview', null, '{{}}'::jsonb)->'capabilities'
       as capacites_ateliers;

-- Annule le contexte temporaire. Aucune contribution n'est créée ou modifiée.
rollback;
"""
    functions = ROOT / "supabase/functions/console-api"
    routes = (functions / "workspace-routes.ts").read_text(encoding="utf-8")
    routes = re.sub(r"\buuid\b", "workspaceUuid", routes)
    handler = (functions / "handler.ts").read_text(encoding="utf-8")
    index = (functions / "index.ts").read_text(encoding="utf-8")
    route_import = "import { resolveWorkspaceRoute } from './workspace-routes.ts'"
    handler_import = "import { createHandler } from './handler.ts'"
    if handler.count(route_import) != 1 or index.count(handler_import) != 1:
        raise RuntimeError("Les imports source ont changé ; vérifier la préparation du fichier Dashboard.")
    handler = handler.replace(route_import, "", 1).strip()
    index = index.replace(handler_import, "", 1).strip()
    bundle = (
        "// Généré depuis supabase/functions/console-api par infra/prepare_console_dashboard.py.\n"
        "// Coller dans index.ts de la fonction EXISTANTE console-api, puis Deploy updates.\n"
        "// Conserver la vérification JWT activée. Aucune clé à ajouter ici.\n\n"
        + routes.strip() + "\n\n" + handler + "\n\n" + index + "\n"
    )
    return {
        "00_verifier.sql": before,
        "01_appliquer.sql": apply,
        "02_controler.sql": after,
        "console-api-dashboard.ts": bundle,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Vérifier les fichiers sans les réécrire")
    args = parser.parse_args()
    for name, content in prepare().items():
        path = TARGET / name
        if args.check:
            if not path.exists() or path.read_text(encoding="utf-8") != content:
                raise SystemExit(f"Fichier à régénérer : {path.relative_to(ROOT)}")
        else:
            TARGET.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8", newline="\n")
    print("Fichiers Dashboard conformes aux sources." if args.check else "Fichiers Dashboard préparés.")


if __name__ == "__main__":
    main()

# Backend

L’API Python/FastAPI orchestre les opérations métier, vérifie l’identité et les droits, applique les contrôles de budget, coordonne recherche et comparaison, valide les sorties, puis enregistre les résultats et leur traçabilité.

## Structure prévue

- `app/api/` : routes versionnées et dépendances d’authentification.
- `app/schemas/` : contrats d’entrée et de sortie validés.
- `app/services/` : besoins, comparaison, orchestration et export.
- `app/repositories/` : accès aux données Supabase.
- `app/providers/` : adaptateurs interchangeables pour génération et embeddings.
- `app/core/` : configuration, erreurs et quotas.

## État

Le parcours des cas est désormais défini dans le RPC PostgreSQL `console_api` : les droits, transitions, tests simulés et traces y sont atomiques. FastAPI fournit une passerelle locale avec le JWT utilisateur ; l’Edge Function `supabase/functions/console-api` fournit les mêmes routes en hébergement partagé. Le parcours de console ne nécessite plus de clé privilégiée dans FastAPI. Voir la [décision 0003](../docs/decisions/0003-console-hebergee-sur-supabase.md).

Le contrôle de santé `/api/v1/health`, les routes `/api/v1/internal/*` et un adaptateur IA simulé sont en place. Le JWT est vérifié par Auth, puis le RPC commun contrôle le rôle et l’opération. Les résultats de test ne contiennent que le marqueur de simulation, des hypothèses et des champs manquants. Les recommandations réelles, le RAG et les quotas des appels IA payants restent à développer.

Lancer depuis la racine : `backend/.venv/Scripts/python -m uvicorn app.main:app --app-dir backend --reload`. Voir [la procédure locale](../docs/console-locale.md) pour les clés, les rôles et les vérifications. Les dépendances sont décrites dans `pyproject.toml` ; les versions exactes et le verrouillage backend restent à aligner par l’équipe.

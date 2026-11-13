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

Le contrôle de santé `/api/v1/health`, la configuration par environnement et un adaptateur IA simulé sont en place. Les routes métier, la validation JWT, les dépôts Supabase, les quotas et les fournisseurs réels restent à développer. Le mode simulé produit uniquement un marqueur de simulation.

Lancer depuis la racine : `backend/.venv/Scripts/python -m uvicorn app.main:app --app-dir backend --reload`. Les dépendances sont décrites dans `pyproject.toml` ; les versions exactes et le verrouillage restent à aligner par l’équipe.

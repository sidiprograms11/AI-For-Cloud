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

Le contrôle de santé `/api/v1/health`, la configuration par environnement, les routes `/api/v1/internal/*` et un adaptateur IA simulé sont en place. Chaque route interne vérifie le jeton Supabase Auth et le rôle avant d’utiliser le client privilégié côté serveur. Le parcours des cas est implémenté pour la pile locale ; les tests enregistrés ne produisent que le marqueur de simulation, des hypothèses et des champs manquants. Les routes de recommandation utilisateur, les dépôts génériques, les quotas des futurs appels IA payants et les fournisseurs réels restent à développer.

Lancer depuis la racine : `backend/.venv/Scripts/python -m uvicorn app.main:app --app-dir backend --reload`. Voir [la procédure locale](../docs/console-locale.md) pour les clés, les rôles et les vérifications. Les dépendances sont décrites dans `pyproject.toml` ; les versions exactes et le verrouillage backend restent à aligner par l’équipe.

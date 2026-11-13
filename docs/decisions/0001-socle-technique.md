# 0001 — Socle technique du prototype

## État

Retenu pour le scaffold partagé, conformément à la demande de mise en place et à l’architecture commune fournie par l’équipe.

## Contexte

Le projet a besoin d’un dépôt et de contrats communs pour que les cinq membres reconstruisent la même application, relisent les contributions et évitent des implémentations incompatibles. Le document `docs/architecture/AI_for_Cloud_Architecture_commune.pdf` distingue les choix d’équipe validés des propositions de socle complémentaire. La demande de cette initialisation retient ces propositions pour établir le scaffold.

## Choix

- GitHub : dépôt commun, branches, pull requests, tâches et décisions.
- Antigravity : environnement d’assistance au développement partagé par l’équipe.
- Supabase avec PostgreSQL : plateforme de données.
- React, TypeScript et Vite : interface Web.
- Python et FastAPI : backend modulaire unique.
- Supabase Auth et Storage : identité et fichiers privés.
- pgvector dans PostgreSQL : stockage des embeddings et recherche vectorielle.
- Adaptateurs séparés pour génération et embeddings ; aucun fournisseur réel n’est présélectionné. Le mode local est simulé.

## Conséquences

- Le frontend ne contient que des paramètres publics et ne porte pas de logique privilégiée.
- Les changements de schéma passent par `supabase/migrations/` et RLS est activé pour les tables métier.
- Les projets locaux utilisent Supabase CLI ; le projet hébergé n’est pas lié automatiquement.
- Le dépôt contient le shell d’interface, l’API de santé, le mode IA simulé et le schéma initial.
- Les versions précises et lockfiles, le modèle LLM, le modèle et la dimension d’embeddings, les budgets, la conservation et l’hébergeur restent ouverts.

## Vérifications à mener

- Revue collective des versions et création des lockfiles.
- Exécution locale sur Supabase CLI et vérification de la migration.
- Vérification des politiques avec deux comptes et des accès Storage.
- Évaluation des modèles et du contrôle de budget avant tout appel payant.

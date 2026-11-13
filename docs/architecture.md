# Architecture de référence

Ce document transforme l’architecture commune fournie par l’équipe en structure de dépôt et en socle local. Le PDF de référence est conservé dans `docs/architecture/`. Le nom du produit conversationnel est **Kora**.

## Socle retenu

- **Interface** : React, TypeScript et Vite.
- **API** : Python et FastAPI, organisée en modules dans un backend unique.
- **Données** : Supabase et PostgreSQL.
- **Identité et fichiers** : Supabase Auth et Storage.
- **Recherche vectorielle** : extension pgvector dans PostgreSQL.
- **IA** : adaptateurs remplaçables pour génération et embeddings ; le mode local actuel est simulé.
- **Développement d’équipe** : GitHub pour code, tâches, branches et pull requests ; Antigravity comme environnement d’assistance utilisé par l’équipe.

Le modèle de génération, le modèle d’embeddings, les versions exactes des outils, la dimension des vecteurs, les budgets et le fournisseur d’hébergement restent à décider. Le projet Supabase hébergé visible dans les paramètres de l’équipe est dans la région `eu-west-1`; la configuration locale du dépôt n’est pas liée à ce projet.

## État du scaffold

- L’interface React affiche le shell Kora, indique explicitement que les recommandations ne sont pas encore disponibles et signale l’état de l’API et la configuration Supabase.
- FastAPI expose `GET /api/v1/health`. Les routes métier et la validation des jetons restent à développer.
- L’interface et le backend disposent d’un emplacement pour le client Supabase. Aucun accès distant n’est configuré.
- `supabase/config.toml` décrit le développement local ; la migration initiale crée les tables, active RLS, installe pgvector et rend les buckets privés.
- L’adaptateur IA mock renvoie un marqueur de simulation et n’appelle aucun service externe.
- Les lockfiles et versions exactes restent à aligner collectivement.

## Frontières et flux cible

```text
Navigateur React
  ├── Supabase Auth (connexion et jeton utilisateur)
  └── API FastAPI /api/v1 (opérations métier)
        ├── contrôle d’identité, droits et budgets
        ├── comparaison explicite des options
        ├── recherche de sources et extraits dans PostgreSQL/pgvector
        ├── adaptateur LLM et embeddings sélectionné
        └── validation, traçabilité et enregistrement du dossier
              ├── PostgreSQL (données métier et catalogue versionné)
              └── Supabase Storage (sources et exports privés)
```

GitHub et Antigravity font partie de l’environnement de développement ; ils ne traitent pas les messages des utilisateurs. Le backend reste un service modulaire unique. Un worker ne sera ajouté que si un traitement long le justifie.

Le parcours cible est : authentification, saisie et clarification, correction du besoin, recherche documentaire, comparaison AWS/Azure/Google Cloud, génération contrôlée, validation et restitution/export. Seuls le shell d’interface et le contrôle de santé sont réalisés. Les étapes métier restent à développer.

## Contrats API visés

Les contrats seront versionnés sous `/api/v1` et partagés entre backend, frontend, documentation et tests.

| Route cible | Rôle |
| --- | --- |
| `GET /health` | État minimal, sans secret ni diagnostic interne |
| `POST /conversations` | Créer une conversation pour l’utilisateur authentifié |
| `GET /conversations/{id}` | Lire uniquement une conversation autorisée |
| `POST /conversations/{id}/messages` | Ajouter un message après contrôle des droits et de la taille |
| `PUT /conversations/{id}/requirements` | Valider une version du besoin ou en créer une nouvelle |
| `POST /conversations/{id}/recommendations` | Lancer une génération bornée et idempotente |
| `GET /recommendations/{id}` | Lire le résultat, ses hypothèses et références autorisées |
| `POST /recommendations/{id}/exports` | Créer ou retrouver un export privé |
| `DELETE /conversations/{id}` | Supprimer selon la politique de conservation à définir |

À part `GET /health`, ces routes ne sont pas implémentées. Les erreurs futures devront avoir un code stable et un `request_id`, sans exposer de clé, de prompt système ou de trace interne.

## Modèle de données initial

La migration crée les tables suivantes dans PostgreSQL :

- `profiles`, `conversations`, `messages` et `requirements` versionnés ;
- `sources` et `chunks`, avec provenance, empreinte, état de validation et champ pgvector sans dimension imposée ;
- `cloud_services` et `criteria` pour le catalogue sourcé et les règles explicites ;
- `recommendations` et `recommendation_sources` pour relier chaque résultat à son besoin et aux extraits ;
- `ai_requests` et `budget_reservations` pour le suivi et les réservations côté serveur ;
- `exports` pour les métadonnées des fichiers privés.

Les dimensions d’embeddings et l’index vectoriel seront définis après le choix du modèle et la mesure du corpus. Aucun fait de catalogue ni aucune recommandation fictive n’est inséré par `seed.sql`.

## Identité, autorisations et données

- Les tables métier activent RLS. Les conversations et leurs messages/besoins sont protégés par la propriété ; les résultats et exports héritent de la propriété de leur ressource parente.
- L’insertion directe de messages est limitée au rôle utilisateur. Les données de résultat et de consommation restent sous contrôle du backend.
- Le catalogue n’est lisible que pour les utilisateurs authentifiés, et les services ne sont visibles qu’avec une source vérifiée.
- Les tables de budgets et de consommation n’ont pas de politique utilisateur. Toute opération privilégiée reste côté serveur.
- Les buckets `recommendation-exports` et `knowledge-sources` sont privés. Une politique de lecture d’export lie le premier dossier du chemin à l’identifiant du propriétaire ; aucun accès client aux fichiers sources n’est accordé.
- Le frontend ne reçoit que des variables `VITE_` et une clé publishable. Une clé `SUPABASE_SECRET_KEY` ne doit jamais être préfixée par `VITE_`.
- Les documents importés par le futur RAG sont des données non fiables et ne peuvent pas modifier les instructions du système.

La validation complète des jetons JWT, les clients Supabase par requête, les liens temporaires Storage, les essais RLS avec deux comptes et les limites atomiques de budget restent à implémenter et à vérifier avant tout usage réel.

## Références

- [Architecture commune de l’équipe](architecture/AI_for_Cloud_Architecture_commune.pdf)
- [Migrations Supabase locales](https://supabase.com/docs/guides/local-development/database-migrations)
- [Développement local avec Supabase](https://supabase.com/docs/guides/local-development)
- [Guide de démarrage Vite](https://vite.dev/guide/)
- [Premières étapes FastAPI](https://fastapi.tiangolo.com/tutorial/first-steps/)

# Architecture de référence

Ce document transforme l’architecture commune fournie par l’équipe en structure de dépôt et en socle local. Le PDF de référence est conservé dans `docs/architecture/`. Le nom du produit conversationnel est **Kora**.

## Socle retenu

Depuis la décision [0003](decisions/0003-console-hebergee-sur-supabase.md), la console utilise une API PostgreSQL commune, exposée par FastAPI en local et par une Edge Function TypeScript sur Supabase. Les fonctions `console_api` (cas) et `workspace_api` (ateliers) contrôlent le rôle et l’auteur à partir du JWT utilisateur ; aucun accès privilégié n’est fourni au navigateur. La cible partagée autorisée est `qxgingqrkzzqccsluntb`. La recherche textuelle est réelle ; la génération reste explicitement simulée.

- **Interface** : React, TypeScript et Vite.
- **API** : Python et FastAPI, organisée en modules dans un backend unique.
- **Données** : Supabase et PostgreSQL.
- **Identité et fichiers** : Supabase Auth et Storage.
- **Recherche vectorielle** : extension pgvector dans PostgreSQL.
- **IA** : adaptateurs remplaçables pour génération et embeddings ; le mode local actuel est simulé.
- **Développement d’équipe** : GitHub pour code, tâches, branches et pull requests ; Antigravity comme environnement d’assistance utilisé par l’équipe.

Le modèle de génération, le modèle d’embeddings, les versions exactes des outils, la dimension des vecteurs, les budgets et le fournisseur d’hébergement restent à décider. Le projet Supabase hébergé visible dans les paramètres de l’équipe est dans la région `eu-west-1`; la configuration locale du dépôt n’est pas liée à ce projet.

## État des parcours implémentés

- L’interface publique React présente un dialogue de démonstration, sans envoi ni sauvegarde. Les logos fournis par l’équipe sont intégrés.
- La console React à `/#/console` comporte cinq espaces : Cloud & besoins, IA & consignes, Backend & versions, Interface & restitution, Qualité & livraison. Les ateliers enregistrent des contributions, des configurations figées, des expériences et des évaluations humaines. Le [guide des ateliers](console-ateliers.md) décrit les parcours ; la [décision 0004](decisions/0004-ateliers-connaissances-et-evaluations.md) en fixe les limites.
- FastAPI expose `GET /api/v1/health` et les routes `/api/v1/internal/*`. Chaque route interne vérifie le jeton Supabase Auth et un rôle serveur (`member`, `reviewer`, `publisher`).
- Le build public utilise `infra/console.public.json` (URL et clé publishable seulement). Le développement conserve `.env` avec les clés de Supabase local.
- `supabase/config.toml` décrit le développement local ; la migration initiale crée les tables, active RLS, installe pgvector et rend les buckets privés. Des migrations supplémentaires créent les cas, les ateliers, leurs historiques et les fonctions transactionnelles. Les migrations déjà appliquées restent immuables.
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

Le parcours utilisateur cible reste : authentification, saisie et clarification, correction du besoin, recherche documentaire, comparaison AWS/Azure/Google Cloud, génération contrôlée, validation et restitution/export. La console prépare ces éléments : fiches, critères, consignes et exemples sont enregistrés, mais aucun moteur de comparaison ni modèle réel ne les exécute encore. Une configuration interne active ne raccorde pas automatiquement le dialogue public.

## Séparation Kora / console

La route `/#/console` est un choix de navigation ; elle n’accorde aucun droit. Chaque requête porte le JWT du compte, vérifié par Auth puis transmis au RPC approprié. Le rôle et les transitions sont contrôlés dans PostgreSQL. Les tables internes ont RLS activé et aucun accès direct `anon`/`authenticated`. Seuls les RPC métier `security definer`, à chemin vide et avec contrôle d’identité/rôle, sont accordés à `authenticated`. Les créations, modifications, tests et publications sont transactionnels. Aucune conversation privée n’alimente les tests internes.

Les **cas d’entreprise** conservent les états `draft → tested → in_review → reviewed → active`, avec `superseded` pour une ancienne version active. Leur cycle reste indépendant de celui des ateliers.

Les **contributions d’atelier** (`workspace_items`) sont typées : source, critère, consigne, exemple attendu, retour d’interface ou contrôle. Chaque sauvegarde crée une révision et une copie dans `workspace_item_history`. Une modification concurrente portant une ancienne révision est refusée. La provenance est obligatoire pour une source et une référence officielle déclarée exige une URL ; cela ne vaut pas vérification automatique du document.

Une **configuration candidate** (`workspace_releases`) copie une consigne et de 1 à 20 sources dans un instantané immuable. Son cycle est `draft → tested → reviewed → active`, puis `superseded`. `workspace_active_configuration` désigne la version interne active. Les expériences enregistrées dans `workspace_experiments` conservent la question, les passages retrouvés, leurs révisions, les consignes et la durée SQL observée. Les notes humaines et les actions sont conservées dans `workspace_evaluations` et `workspace_events`. Aucune métrique LLM n’est fabriquée : tokens et coût restent nuls au sens SQL (`null`, valeur inconnue).

La recherche utilise le texte français de PostgreSQL (`tsvector`, index GIN et `websearch_to_tsquery`). Le laboratoire recherche dans les sources de l’instantané, sans embeddings ni appel LLM. Les tables `sources` et `chunks` du socle restent réservées au futur corpus validé/vectorisé ; une fiche de préparation ne les alimente pas automatiquement. Les imports texte restent des données non fiables. La validation et l’activation exigent les droits serveur et une relecture distincte ; l’activation et le retour arrière verrouillent le pointeur en transaction.

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

Les jetons et les rôles sont vérifiés par les routes internes, avec des essais locaux à plusieurs comptes et des refus d’accès direct aux tables pour les quatre opérations CRUD. Les liens temporaires Storage, les règles d’accès du futur dialogue, sa conservation et les limites atomiques de budget restent à implémenter avant un usage IA réel.

## Références

- [Architecture commune de l’équipe](architecture/AI_for_Cloud_Architecture_commune.pdf)
- [Décision sur le premier lot de console](decisions/0002-console-locale-et-versions-de-cas.md)
- [Migrations Supabase locales](https://supabase.com/docs/guides/local-development/database-migrations)
- [Développement local avec Supabase](https://supabase.com/docs/guides/local-development)
- [Guide de démarrage Vite](https://vite.dev/guide/)
- [Premières étapes FastAPI](https://fastapi.tiangolo.com/tutorial/first-steps/)

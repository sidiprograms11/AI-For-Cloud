# AI for Cloud

AI for Cloud est un projet de fin d’études réalisé par cinq élèves ingénieurs de dernière année à l’Efrei, en spécialisation CSIG. Le prototype, dont le nom de produit est **Kora**, doit aider les entreprises à formaliser leurs besoins et à comparer des architectures chez AWS, Microsoft Azure et Google Cloud.

## Socle technique

Le dépôt suit le socle d’architecture commun fourni par l’équipe : React, TypeScript et Vite pour l’interface ; Python et FastAPI pour l’API ; Supabase avec PostgreSQL pour les données ; Supabase Auth et Storage ; pgvector pour les embeddings. Les appels IA passent par des adaptateurs. Le mode par défaut est simulé.

Le modèle de génération, les embeddings, les budgets et la conservation restent à choisir. Le parcours de console est hébergé sur le projet Supabase **IA FOR CLOUD**, région `eu-west-1`, via PostgreSQL, Auth et une Edge Function TypeScript. FastAPI conserve les mêmes contrats en développement local. Voir la [décision 0003](docs/decisions/0003-console-hebergee-sur-supabase.md).

## État de l’application

Deux interfaces partagent le dépôt :

- **Kora** (`/`) : expérience conversationnelle épurée avec les visuels fournis par l’équipe. Les messages et réponses de démonstration restent dans le navigateur. Aucune comparaison, recommandation réelle ou sauvegarde n’est effectuée.
- **Console interne** (`/#/console`) : cinq espaces. Le premier enregistre des cas, leurs contraintes, des tests simulés et des versions. Une relecture par un autre compte est obligatoire avant publication. Les quatre autres espaces sont marqués « À développer ». L’accès exige un compte Auth et un rôle interne.

Le site [ai-kora.cloud](https://ai-kora.cloud) héberge le frontend ; [la console d’équipe](https://ai-kora.cloud/#/console) utilise l’API Supabase. Son premier compte demandé est `sidi.gano@efrei.net`. Le propriétaire définit son mot de passe depuis une première connexion autorisée. Le partage d’un seul compte empêche l’identification des personnes et l’auto-relecture reste interdite. Le RAG, le LLM réel et les coûts calculés restent indisponibles. Voir le [guide de déploiement](docs/deploiement-console-supabase.md) et le [guide local](docs/console-locale.md).

Le premier parcours interne a été vérifié le 17 novembre 2026 sur une pile Supabase locale après remise à zéro des migrations ; les 6 tests backend ont réussi. La revue visuelle dans un navigateur reste à faire.

## Prérequis

- Node.js 22.12 ou supérieur pour Vite.
- Python 3.12 ou supérieur.
- Docker Desktop et Supabase CLI pour lancer la pile Supabase locale.

Le lockfile frontend est versionné. Le choix de l’hébergement du futur moteur IA Python reste ouvert.

## Démarrage local

1. Copier `.env.example` vers `.env` à la racine. Reporter les clés de la pile Supabase locale après `supabase start` ; les valeurs de l’exemple ne sont pas des identifiants réels.
2. Dans un terminal, depuis la racine, installer les dépendances frontend et lancer Vite :

   ```powershell
   Set-Location frontend
   npm.cmd ci
   npm run dev
   ```

3. Dans un second terminal, depuis la racine, installer et lancer l’API :

   ```powershell
   py -3.12 -m venv backend/.venv
   backend/.venv/Scripts/python -m pip install -e 'backend[dev]'
   backend/.venv/Scripts/python -m uvicorn app.main:app --app-dir backend --reload
   ```

4. Pour lancer Supabase localement, avec Docker actif (CLI 3.2.0 utilisée lors de la vérification) :

   ```powershell
   npx.cmd --yes supabase@3.2.0 start
   npx.cmd --yes supabase@3.2.0 db reset
   ```

`db reset` efface les données de la base **locale** ; le réserver à une pile de test. La CLI peut aussi être installée séparément par l’équipe. Voir [la procédure détaillée](docs/console-locale.md) pour les comptes et tests locaux. Le fichier `.env` local n’est jamais importé dans le build public ; seule la configuration publique explicitement déclarée dans `infra/console.public.json` y entre.

## Structure

```text
frontend/                 React, TypeScript, Vite et client Supabase
backend/app/              API, schémas, services, dépôts et adaptateurs
supabase/migrations/      Schéma PostgreSQL versionné, RLS et pgvector
supabase/seed.sql         Point d’entrée pour fixtures fictives
knowledge/                Inventaire et futurs scripts du corpus documentaire
tests/                    Contrôles et scénarios communs
docs/                     Cadrage, architecture, recherches et décisions
infra/                    Configuration publique et déploiement de la console
supabase/functions/       Passerelle Edge de la console hébergée
```

## Contribution

Travailler sur une branche par sujet, faire relire chaque pull request, versionner les migrations et ne jamais committer de secret. Lire `AGENTS.md`, `CONTRIBUTING.md` et `docs/architecture.md`. Les contributions préparées avec une IA doivent être comprises et vérifiées par l’équipe.

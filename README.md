# AI for Cloud

AI for Cloud est un projet de fin d’études réalisé par cinq élèves ingénieurs de dernière année à l’Efrei, en spécialisation CSIG. Le prototype, dont le nom de produit est **Kora**, doit aider les entreprises à formaliser leurs besoins et à comparer des architectures chez AWS, Microsoft Azure et Google Cloud.

## Socle technique

Le dépôt suit le socle d’architecture commun fourni par l’équipe : React, TypeScript et Vite pour l’interface ; Python et FastAPI pour l’API ; Supabase avec PostgreSQL pour les données ; Supabase Auth et Storage ; pgvector pour les embeddings. Les appels IA passent par des adaptateurs. Le mode par défaut est simulé.

Le modèle de génération, le modèle d’embeddings, les seuils de budget, la conservation des données, les versions exactes des outils et l’hébergement restent à choisir. Le projet Supabase présenté par l’équipe est en région `eu-west-1` ; le dépôt est configuré pour un développement local et ne se connecte pas automatiquement au projet hébergé.

## État de l’application

Deux interfaces partagent le dépôt :

- **Kora** (`/`) : expérience conversationnelle épurée avec les visuels fournis par l’équipe. Les messages et réponses de démonstration restent dans le navigateur. Aucune comparaison, recommandation réelle ou sauvegarde n’est effectuée.
- **Console interne** (`/#/console`) : cinq espaces de travail. Le premier permet, sur la pile **Supabase locale**, de créer un cas, modifier ses contraintes, lancer un test explicitement simulé, demander une relecture, publier une version et revenir à une version publiée. L’API FastAPI contrôle Auth et les rôles à chaque route. Les quatre autres espaces sont marqués « À développer ».

Le site public `ai-kora.cloud` héberge seulement le frontend statique ; la console fonctionnelle nécessite l’API et Supabase locaux. Le RAG, le LLM réel, les recommandations et les coûts calculés ne sont pas disponibles. Voir [le guide de la console locale](docs/console-locale.md).

## Prérequis

- Node.js 22.12 ou supérieur pour Vite.
- Python 3.12 ou supérieur.
- Docker Desktop et Supabase CLI pour lancer la pile Supabase locale.

Le lockfile frontend est versionné. Les choix de modèles IA et d’hébergement du backend restent ouverts.

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

4. Pour lancer Supabase localement, avec Docker actif :

   ```powershell
   supabase start
   supabase db reset
   ```

Voir [la procédure détaillée](docs/console-locale.md) pour créer les comptes de test, attribuer les rôles locaux et vérifier le parcours. Aucun appel payant ni accès au projet Supabase hébergé n’est configuré.

## Structure

```text
frontend/                 React, TypeScript, Vite et client Supabase
backend/app/              API, schémas, services, dépôts et adaptateurs
supabase/migrations/      Schéma PostgreSQL versionné, RLS et pgvector
supabase/seed.sql         Point d’entrée pour fixtures fictives
knowledge/                Inventaire et futurs scripts du corpus documentaire
tests/                    Contrôles et scénarios communs
docs/                     Cadrage, architecture, recherches et décisions
infra/                    Périmètre de déploiement, hébergeur encore ouvert
```

## Contribution

Travailler sur une branche par sujet, faire relire chaque pull request, versionner les migrations et ne jamais committer de secret. Lire `AGENTS.md`, `CONTRIBUTING.md` et `docs/architecture.md`. Les contributions préparées avec une IA doivent être comprises et vérifiées par l’équipe.

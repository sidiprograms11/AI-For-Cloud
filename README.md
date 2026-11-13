# AI for Cloud

AI for Cloud est un projet de fin d’études réalisé par cinq élèves ingénieurs de dernière année à l’Efrei, en spécialisation CSIG. Le prototype, dont le nom de produit est **Kora**, doit aider les entreprises à formaliser leurs besoins et à comparer des architectures chez AWS, Microsoft Azure et Google Cloud.

## Socle technique

Le dépôt suit le socle d’architecture commun fourni par l’équipe : React, TypeScript et Vite pour l’interface ; Python et FastAPI pour l’API ; Supabase avec PostgreSQL pour les données ; Supabase Auth et Storage ; pgvector pour les embeddings. Les appels IA passent par des adaptateurs. Le mode par défaut est simulé.

Le modèle de génération, le modèle d’embeddings, les seuils de budget, la conservation des données, les versions exactes des outils et l’hébergement restent à choisir. Le projet Supabase présenté par l’équipe est en région `eu-west-1` ; le dépôt est configuré pour un développement local et ne se connecte pas automatiquement au projet hébergé.

## État de l’application

L’interface comporte un **premier prototype visuel** responsive : vue d’ensemble, écran de saisie, comparaison des trois fournisseurs et structure d’un dossier technique. La navigation entre ces écrans sert à explorer la maquette. Les exemples sont fictifs ; aucune donnée n’est envoyée ou enregistrée, aucune comparaison ni recommandation n’est calculée. L’API expose séparément un contrôle de santé et le fournisseur IA simulé est marqué comme tel. La migration établit le schéma de données initial, l’extension pgvector et les politiques RLS. Les fonctionnalités métier, l’authentification complète, le RAG et la génération réelle restent à développer.

## Prérequis

- Node.js 22.12 ou supérieur pour Vite.
- Python 3.12 ou supérieur.
- Docker Desktop et Supabase CLI pour lancer la pile Supabase locale.

Les versions exactes et lockfiles seront alignés par l’équipe avant les développements fonctionnels.

## Démarrage local

1. Copier `.env.example` vers `.env` à la racine. Les valeurs sont des exemples locaux, pas des identifiants du projet hébergé.
2. Dans un terminal, depuis la racine, installer les dépendances frontend et lancer Vite :

   ```powershell
   Set-Location frontend
   npm install
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

Les clés locales affichées par `supabase start` peuvent être ajoutées à `.env`. Le mode IA reste simulé par défaut. Aucun appel payant ni accès au projet Supabase hébergé n’est configuré.

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

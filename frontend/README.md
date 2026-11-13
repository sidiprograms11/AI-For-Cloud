# Interface Web

L’interface cible est construite avec React, TypeScript et Vite. Elle utilisera le client Supabase pour l’authentification et transmettra les opérations métier à l’API FastAPI. Aucun secret LLM ou accès privilégié Supabase ne doit se trouver dans le frontend.

## État

Le shell Kora, le client API minimal et l’initialisation conditionnelle du client Supabase sont en place. Le parcours d’authentification, le questionnaire, le chat, la validation du besoin, l’affichage du dossier et l’export restent à développer.

## Développement

Copier le `.env.example` racine vers `.env` à la racine, puis lancer depuis ce dossier `npm install` et `npm run dev`. Le mode Vite lit la configuration racine et n’expose au navigateur que les variables `VITE_`.

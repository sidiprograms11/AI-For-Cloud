# Interface Web

L’interface cible est construite avec React, TypeScript et Vite. Elle utilisera le client Supabase pour l’authentification et transmettra les opérations métier à l’API FastAPI. Aucun secret LLM ou accès privilégié Supabase ne doit se trouver dans le frontend.

## État

Un prototype visuel responsive présente quatre écrans : accueil, saisie du besoin, comparaison et dossier technique. Les boutons de navigation changent seulement l’écran affiché. Les champs sont illustratifs et ne sauvegardent rien. Les exemples et états sont explicitement fictifs. Le client API minimal et l’initialisation conditionnelle du client Supabase restent dans le code pour les développements suivants, mais la maquette ne les appelle pas. Le parcours d’authentification, le questionnaire fonctionnel, le chat, la validation du besoin, les résultats réels et l’export restent à développer.

## Développement

Copier le `.env.example` racine vers `.env` à la racine, puis lancer depuis ce dossier `npm install` et `npm run dev`. Le mode Vite lit la configuration racine et n’expose au navigateur que les variables `VITE_`.

# Interface Web

L’interface React/TypeScript/Vite utilise Supabase Auth et transmet les opérations métier à FastAPI en développement, ou à l’Edge Function Supabase pour le site partagé. Aucun secret LLM ou accès privilégié Supabase ne se trouve dans le frontend.

## État

`/` présente Kora comme conversation simple. Les messages restent en mémoire dans le navigateur ; la réponse est une simulation explicite. `/#/console` propose une connexion par mot de passe ou lien e-mail et cinq espaces de travail. Les composants de `src/workspace/` gèrent les contributions, les configurations figées, les expériences de recherche/simulation, la restitution et les évaluations humaines. Les cas et leurs versions restent disponibles dans Cloud & besoins. Les données sont enregistrées par l’API, jamais seulement dans l’état du navigateur.

Les visuels de l’équipe restent dans `public/brand/`. La console est chargée à la demande pour alléger l’ouverture de Kora. Le build ne lit pas `.env` ; il utilise uniquement l’URL et la clé publishable déclarées dans `infra/console.public.json`. Voir le [guide des ateliers](../docs/console-ateliers.md) pour les parcours et limites.

## Développement

Copier le `.env.example` racine vers `.env` à la racine, ajouter les clés **locales** et lancer `npm.cmd ci` puis `npm.cmd run dev` depuis ce dossier. Vite ne met dans le navigateur que les variables `VITE_`. Voir [le guide de la console](../docs/console-locale.md).

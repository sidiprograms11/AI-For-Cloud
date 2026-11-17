# Interface Web

L’interface React/TypeScript/Vite utilise Supabase Auth et transmet les opérations métier à FastAPI en développement, ou à l’Edge Function Supabase pour le site partagé. Aucun secret LLM ou accès privilégié Supabase ne se trouve dans le frontend.

## État

`/` présente Kora comme conversation simple. Les messages restent en mémoire dans le navigateur ; la réponse est une simulation explicite. `/#/console` présente cinq espaces internes et propose mot de passe ou lien e-mail. Le premier espace enregistre les cas, tests et versions. Les quatre autres indiquent « À développer ». Les visuels de l’équipe restent dans `public/brand/`. Le build ne lit pas `.env` ; il utilise uniquement l’URL et la clé publishable déclarées dans `infra/console.public.json`.

## Développement

Copier le `.env.example` racine vers `.env` à la racine, ajouter les clés **locales** et lancer `npm.cmd ci` puis `npm.cmd run dev` depuis ce dossier. Vite ne met dans le navigateur que les variables `VITE_`. Voir [le guide de la console](../docs/console-locale.md).

# Interface Web

L’interface cible est construite avec React, TypeScript et Vite. Elle utilisera le client Supabase pour l’authentification et transmettra les opérations métier à l’API FastAPI. Aucun secret LLM ou accès privilégié Supabase ne doit se trouver dans le frontend.

## État

`/` présente Kora comme conversation simple. Les messages restent en mémoire dans le navigateur ; la réponse est une **simulation explicite** et ne produit aucune recommandation. `/#/console` présente cinq espaces internes. Le premier utilise Supabase Auth local et l’API FastAPI pour enregistrer des cas, tests et versions. Les quatre autres indiquent « À développer ». Sur le site public statique, la console indique que le backend local n’est pas disponible. Les visuels Kora fournis par l’équipe sont conservés dans `public/brand/`.

## Développement

Copier le `.env.example` racine vers `.env` à la racine, ajouter les clés **locales** et lancer `npm.cmd ci` puis `npm.cmd run dev` depuis ce dossier. Vite ne met dans le navigateur que les variables `VITE_`. Voir [le guide de la console](../docs/console-locale.md).

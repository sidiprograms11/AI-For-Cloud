# Contribuer

Le dépôt est partagé par l’équipe du projet AI for Cloud. Le socle d’interface, d’API et de données est décrit dans `docs/architecture.md` ; le modèle LLM, les embeddings, les versions exactes et l’hébergement restent à arbitrer. Toute contribution doit rester compréhensible, relue et vérifiable par l’équipe, y compris lorsqu’elle a été préparée avec un outil d’IA.

## Avant de contribuer

- Lire `README.md`, `AGENTS.md` et les documents `docs/` liés au sujet.
- Vérifier l’état du dépôt et les décisions déjà consignées dans `docs/decisions/`.
- Lire `docs/architecture.md` et le document d’architecture commun avant de modifier une brique.
- Pour un choix technique nouveau ou un changement de socle, décrire le besoin, les options et les compromis dans une décision avant de le traiter comme acquis.

## Branches et pull requests

- Créer une branche distincte par changement cohérent, à partir de la branche principale à jour.
- Utiliser un nom descriptif, par exemple `docs/cadrage` ou `feat/recueil-besoin`.
- Ouvrir une pull request vers la branche principale et résumer le besoin, les changements et les éventuels points à arbitrer.
- Faire relire la pull request par un autre membre de l’équipe avant intégration. Traiter les remarques et vérifier que la documentation correspond au comportement livré.
- Ne pas intégrer directement un changement fonctionnel non relu dans la branche principale.

## Qualité et documentation

- Limiter chaque contribution à un objectif clair et signaler explicitement les limites ou hypothèses.
- Ajouter ou mettre à jour la documentation et les décisions techniques concernées.
- Toute modification de données passe par une migration dans `supabase/migrations/`. Tester la migration sur Supabase local ; ne pas modifier une migration déjà appliquée, ajouter une migration corrective.
- Les tables exposées ont RLS activé. Toute PR qui ajoute une table ou un accès doit expliquer les politiques et vérifier les cas entre deux utilisateurs.
- Le mode local utilise le fournisseur IA simulé. Les tests qui appellent un fournisseur réel doivent être ciblés, documentés et approuvés par l’équipe en raison des coûts et du traitement des données.
- Pour les affirmations sur les fournisseurs, services, tarifs ou sécurité, citer des sources adaptées et vérifier qu’elles sont à jour.
- Ne jamais inclure de secret, donnée sensible réelle ou identifiant d’accès dans le dépôt. Utiliser des variables locales ignorées par Git et maintenir `.env.example` sans valeur sensible.
- Les contributions générées par IA doivent être comprises, relues et vérifiées par les contributeurs humains.

## Vérifications

Exécuter les vérifications pertinentes déjà définies par le projet, lorsque celles-ci existent, et en indiquer le résultat dans la pull request. Ne pas annoncer de commande de test ou d’installation avant que la pile correspondante soit choisie et configurée.

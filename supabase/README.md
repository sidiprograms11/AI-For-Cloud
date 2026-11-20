# Supabase local

La configuration de ce dossier décrit la pile locale Supabase CLI. Les migrations définissent le schéma partagé et `seed.sql` est réservé aux fixtures de développement clairement fictives.

Le `project_id` de `config.toml` est un identifiant local de CLI. Le projet hébergé montré par l’équipe n’est ni lié ni modifié par cette configuration. Utiliser la pile locale pour les migrations et essais avant toute opération distante.

Les tables métier activent RLS. Les tables de consommation et de réservations budgétaires n’ont volontairement aucune politique utilisateur : elles sont réservées au backend avec accès privilégié contrôlé. La migration `20261117000000_internal_console.sql` ajoute les données de console : leurs privilèges `anon` et `authenticated` sont révoqués et RLS reste actif. Les fonctions de création et de publication sont réservées à `service_role`. Les clés privilégiées ne doivent jamais être exposées au frontend. Voir [le guide local](../docs/console-locale.md).

# Infrastructure et déploiement

## Rôle prévu

Décrire et, lorsque les choix seront validés, configurer les environnements nécessaires à l’exécution et à la démonstration du prototype.

## Entrées et sorties prévues

- **Entrées** : décisions d’architecture, exigences de sécurité et de confidentialité, contraintes de démonstration et paramètres d’environnement.
- **Sorties** : configuration reproductible et documentée pour les environnements retenus.

## État et travail restant

La pile locale reste définie dans `supabase/config.toml`. Le frontend public est hébergé par Sites ; la console utilise le projet Supabase IA FOR CLOUD et l’Edge Function `console-api`. `console.public.json` contient uniquement l’URL et la clé publishable. `supabase-console/supabase/config.toml` déclare les seules propriétés Auth à appliquer au projet distant. Les scripts Python de ce dossier reçoivent les clés privilégiées via stdin et ne les affichent ni ne les enregistrent. Voir la [procédure](../docs/deploiement-console-supabase.md).

`prepare_console_dashboard.py` ne demande aucune clé : il génère depuis les sources versionnées les [fichiers à copier dans SQL Editor et Edge Functions](supabase-console/dashboard/README.md). L'option `--check` vérifie leur conformité sans réécriture.

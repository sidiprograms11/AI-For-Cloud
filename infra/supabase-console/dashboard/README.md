# Mise à jour manuelle de la console dans Supabase

Cette procédure répond à la demande de mise à jour par SQL Editor du 24 novembre 2026. Elle cible seulement **IA FOR CLOUD**, identifiant `qxgingqrkzzqccsluntb`. L'assistant ne l'exécute pas sur le projet distant. Les sources de la migration et de l'API restent celles du dépôt.

## 1. Vérifier le projet et la base

Ouvrir [SQL Editor du projet](https://supabase.com/dashboard/project/qxgingqrkzzqccsluntb/sql/new), choisir le rôle administrateur `postgres`, copier **tout** `00_verifier.sql` dans une nouvelle requête, puis **Run**.

Avant la mise à jour, les trois versions attendues sont `20261113000000`, `20261117000000` et `20261117140000`. `membres_existants` doit être renseigné ; `ateliers_existants` et `api_ateliers` doivent être `NULL`. Le compte `sidi.gano@efrei.net` doit apparaître avec son rôle existant `publisher`.

Si la version `20261117160000` apparaît déjà, passer au contrôle de l'étape 3. Si des objets atelier existent sans cette version, ou si le socle/compte/rôle manque, transmettre le résultat avant de continuer. Ne pas supprimer d'objets pour forcer le passage.

## 2. Appliquer la migration complète

Dans une nouvelle requête du même projet, copier **tout** `01_appliquer.sql`, du premier commentaire à la dernière ligne, puis **Run**, une fois. Ce fichier inclut le contenu intégral de `supabase/migrations/20261117160000_console_workspaces.sql`, sans réécriture de cette migration. Il applique les sept tables, les index, RLS, les privilèges et le RPC `workspace_api`, puis enregistre la version et son SQL dans `supabase_migrations.schema_migrations` dans la même transaction. Il demande à PostgREST de recharger son schéma.

Résultat attendu : `Migration 20261117160000 appliquée et enregistrée.` Une erreur interrompt la transaction ; transmettre son texte. Une deuxième exécution est volontairement refusée. Le fichier n'efface pas les cas existants, ne crée aucun utilisateur et ne modifie aucun mot de passe. Le maintien de l'historique évite que la CLI tente de rejouer cette migration plus tard.

## 3. Contrôler PostgreSQL

Copier et exécuter **tout** `02_controler.sql`. Il doit montrer la migration, sept tables avec les trois indicateurs de protection à `true`, puis `rpc_connecte_autorise = true` et `rpc_anonyme_refuse = true`.

Le dernier résultat `capacites_ateliers` doit contenir :

```json
{"generation": false, "embeddings": false, "fine_tuning": false, "lexical_search": true, "max_items": 500}
```

Ce contrôle administrateur emprunte temporairement l'identité du compte existant dans sa transaction pour lire le RPC ; le `ROLLBACK` final annule ce contexte. Il ne crée aucune fiche, configuration ou expérience. Ce contrôle SQL ne valide pas encore l'API HTTP ni le navigateur.

## 4. Mettre à jour l'API, hors SQL Editor

Dans **Edge Functions → console-api → Code**, conserver la fonction existante et remplacer le contenu de son `index.ts` par **tout** `console-api-dashboard.ts`. Ce fichier réunit les trois sources canoniques de l'API, sans import de fichier local. Cliquer **Deploy updates**. Conserver la vérification JWT activée et les paramètres/secrets existants ; aucune clé supplémentaire n'est à saisir dans le code. Ne pas créer une seconde fonction portant un autre nom.

Le SQL met à jour PostgreSQL ; cette étape distincte met à jour les routes HTTP que le frontend appelle. Sans elle, les nouvelles routes renverront encore une erreur malgré une migration réussie.

## 5. Tester dans la console

Ouvrir [la console](https://ai-kora.cloud/#/console), se reconnecter si nécessaire, puis créer une fiche Cloud et recharger la page. Vérifier la persistance avant d'ajouter des consignes, une configuration et une expérience. La recherche est textuelle et la génération reste simulée. Avec le compte partagé, l'auto-validation demeure bloquée ; aucun choix de modèle ni entraînement n'est activé par ces scripts.

En cas d'erreur, transmettre le texte SQL ou le message de la console, sans jeton ni clé. Un `404` sur une nouvelle route après l'étape 3 peut indiquer que l'étape 4 manque ; un `401` demande une session valide ; un `403` peut venir du rôle interne.

## Préparation et validation des fichiers

Depuis la racine : `py -3.13 infra/prepare_console_dashboard.py`. Pour vérifier leur conformité aux sources sans les réécrire : ajouter `--check`. La migration appliquée ne doit jamais être modifiée pour corriger le schéma : ajouter une nouvelle migration si nécessaire.

Le 24 novembre 2026, les trois scripts ont été exécutés avec succès, dans leur ordre, sur une base jetable locale préparée à partir du schéma Supabase et de trois migrations initiales. Le contrôle a vérifié les sept tables, RLS, les privilèges et le RPC au nom d'un compte de fixture. Le rejeu et la présence d'objets sans historique ont été refusés sans suppression. Les dix tests existants de la passerelle ont également réussi contre le fichier Dashboard généré, avec un préchargement Node simulant uniquement le démarrage Deno. Le projet hébergé n'a pas été modifié par ces vérifications.

Le propriétaire a ensuite partagé les captures de réussite de la migration, du RPC de contrôle et de la mise à jour de `console-api` dans IA FOR CLOUD. Les contrôles HTTP distants de l'assistant ont confirmé OPTIONS 204 avec l'origine Kora autorisée et GET 401 sans session. La sauvegarde authentifiée dans le navigateur reste à tester selon l'étape 5 ; elle n'est pas prouvée par ces seuls contrôles.

Références : [historique des migrations](https://supabase.com/docs/guides/deployment/database-migrations), [modification d'une Edge Function dans le Dashboard](https://supabase.com/docs/guides/functions/quickstart-dashboard).

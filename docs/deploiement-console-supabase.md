# Déploiement de la console d’équipe

## Mise en service vérifiée le 17 novembre 2026

Les trois migrations ont été appliquées sur le projet cible, l’Edge Function `console-api` est déployée avec vérification JWT et les URL Auth de Kora sont configurées. Le compte demandé a été créé et son rôle vérifié par un appel authentifié à l’API distante ; la session de contrôle a été révoquée. La lecture des cas répond HTTP 200 et l’accès direct aux tables internes est refusé. Supabase a accepté une demande de lien e-mail pour le compte ; sa réception et l’ouverture dans le navigateur restent à vérifier par le propriétaire.

## Cible autorisée et préparation

Cette procédure concerne exclusivement **IA FOR CLOUD** (`qxgingqrkzzqccsluntb`, région `eu-west-1`), à la demande de mise en ligne de la console. Elle ne cible aucun autre projet. Ne pas utiliser `db reset` sur cette cible. Ne pas changer de plan ni activer de fournisseur IA.

Avant toute écriture distante : lire les règles du dépôt et la décision 0003, appliquer la nouvelle migration sur Supabase local, exécuter le parcours intégré sur FastAPI puis Edge, et compiler le frontend. Inspecter l’historique distant et les tables existantes, puis exécuter le plan à blanc. L’inspection du 17 novembre 2026 a trouvé le schéma `public` vide et aucune migration locale déjà appliquée à cette cible.

```powershell
npx.cmd --yes supabase@3.2.0 migration list --remote=qxgingqrkzzqccsluntb
npx.cmd --yes supabase@3.2.0 db push --remote=qxgingqrkzzqccsluntb --dry-run --skip-vault
```

Pour la mise en service initiale du 17 novembre, le plan comprenait les migrations `20261113000000`, `20261117000000` et `20261117140000`, sans seed ni rôle SQL global ajouté. Elles sont désormais appliquées : ne pas les rejouer ni les modifier.

## Lot des cinq ateliers préparé le 20 novembre 2026

La **version Sites 6** (source `d984f3ceb77d7999910a03cb1753d977ea03f625`) a été publiée le 20 novembre à la demande de mise en ligne de la dernière interface. Le déploiement Sites a réussi. **La migration des ateliers et la nouvelle passerelle Edge restent en attente** : le compte CLI `sidigano8@gmail.com` reçoit HTTP 403 sur le projet IA FOR CLOUD. Les nouvelles rubriques sont visibles, mais leur lecture et leurs sauvegardes ne sont pas encore opérationnelles sur le projet partagé. Ne pas présenter ce déploiement du frontend comme une mise en service complète des ateliers. La base et le mot de passe existants n’ont pas été modifiés.

La [décision 0004](decisions/0004-ateliers-connaissances-et-evaluations.md) décrit ce lot autorisé. La migration supplémentaire est `20261117160000_console_workspaces.sql`. Elle ajoute les contributions, instantanés, expériences, évaluations, événements et le RPC `workspace_api`. Les vérifications locales incluent les refus CRUD directs, les rôles distincts, les conflits de révision, les instantanés, l’activation et le retour arrière ; voir [tests/README.md](../tests/README.md).

Avant ce déploiement, la CLI doit montrer IA FOR CLOUD dans les projets du compte actif. Un HTTP 403 sur l’API de gestion est un problème de droits à résoudre ; ne pas changer de cible ni réinitialiser la base pour le contourner. Un diagnostic IPv6 de la CLI ne suffit pas à conclure à une panne DNS : vérifier d’abord le compte et les droits. Ne jamais demander une clé privilégiée dans la conversation.

L’historique attendu contient les trois migrations initiales. Le plan à blanc doit annoncer **uniquement** `20261117160000_console_workspaces.sql`. Si une autre migration apparaît, examiner l’écart avant d’appliquer. Appliquer la migration, déployer `console-api`, vérifier les routes d’atelier, puis publier le frontend avec Sites. Le formulaire de connexion et le mot de passe existant sont conservés. Le [guide d’utilisation](console-ateliers.md) précise les fonctionnalités et les limites du mode simulé.

## Mise en service

```powershell
npx.cmd --yes supabase@3.2.0 db push --remote=qxgingqrkzzqccsluntb --skip-vault --yes
npx.cmd --yes supabase@3.2.0 functions deploy console-api --remote=qxgingqrkzzqccsluntb --use-api --yes
```

Conserver `verify_jwt = true` dans `supabase/config.toml`. L’Edge Function revalide la session avec Auth et utilise la clé publique pour appeler le RPC au nom de l’utilisateur. Ne pas déployer avec `--no-verify-jwt`, ne pas exposer de clé `service_role` au navigateur et ne pas utiliser `--prune`.

Configurer Auth : URL du site `https://ai-kora.cloud`, redirections autorisées vers `https://ai-kora.cloud/**` et `https://www.ai-kora.cloud/**`. Préserver les options d’authentification existantes. Créer ou retrouver le seul compte demandé `sidi.gano@efrei.net`, puis attribuer le rôle applicatif `publisher` dans `internal_members`. Ne pas réinitialiser le mot de passe d’un compte existant. Le propriétaire peut demander un lien de connexion depuis la console ; la réception du mail doit être vérifiée par lui.

Le rôle applicatif n’accorde aucun accès au tableau de bord Supabase. Avec un seul compte, le test, la création et la modification sont disponibles ; la validation de ses propres versions reste refusée. Des comptes individuels autorisés sont nécessaires pour une relecture distincte.

## Frontend et vérification

Renseigner dans `infra/console.public.json` uniquement `supabaseUrl` et `publishableKey` (préfixe `sb_publishable_`). L’URL de l’API est dérivée sous `/functions/v1/console-api`. Compiler et publier avec le workflow Sites de ce dépôt en conservant son identifiant et son audience. Le `.env` local reste ignoré et n’entre pas dans le build public.

Vérifier : site public accessible, console à `https://ai-kora.cloud/#/console`, prérequêtes CORS, refus sans jeton, refus d’un compte sans rôle, puis connexion par le propriétaire. Le compte ne doit pas voir de données avant vérification de son rôle. Ne pas annoncer une connexion e-mail réussie avant que le propriétaire ait ouvert le lien.

Pour tester en local la même Edge Function : `npx.cmd --yes supabase@3.2.0 functions serve console-api`. Le test intégré Python accepte `CONSOLE_EDGE_URL=http://127.0.0.1:54321/functions/v1/console-api` et refuse toute cible distante. Les clés de test proviennent uniquement de `supabase status -o env`.

## Retour en arrière

Une ancienne version du frontend peut être redéployée via Sites. Les migrations ajoutées ne sont pas supprimées ni réécrites ; une correction de base exige une nouvelle migration. Pour retirer immédiatement l’accès à la console, supprimer le rôle applicatif du compte après demande de l’équipe. Les versions actives des cas disposent de leur propre retour en arrière transactionnel dans la console.

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

Le plan attendu comprend les migrations `20261113000000`, `20261117000000` et `20261117140000`, sans seed ni rôle SQL global ajouté. Si l’état distant diffère, examiner les différences avant de poursuivre.

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

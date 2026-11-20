# Console interne : développement et tests locaux

## État réel

Ce guide décrit le développement local. La console partagée est raccordée à Supabase selon la [décision 0003](decisions/0003-console-hebergee-sur-supabase.md) et le [guide de déploiement](deploiement-console-supabase.md). Le compte et les clés de développement restent distincts de ceux de l’environnement partagé. FastAPI et l’Edge Function utilisent les mêmes fonctions PostgreSQL `console_api` et `workspace_api`.

La console React est accessible à `http://127.0.0.1:5173/#/console` lorsque le frontend, l’API et Supabase local sont lancés. Une connexion Supabase Auth et un rôle dans `internal_members` sont nécessaires. Les cinq espaces proposent des outils persistants. Le [guide des ateliers](console-ateliers.md) décrit l’import de fiches Cloud, les consignes, les exemples, les configurations, le laboratoire, les retours et les évaluations.

Le site `ai-kora.cloud` héberge un frontend statique : le dialogue public est une simulation dans le navigateur ; la console authentifiée appelle l’Edge Function Supabase distante. FastAPI n’est pas hébergé sur ce domaine. La configuration Vite charge `.env` pour `npm run dev` et désactive explicitement son chargement pour `npm run build` ; le build utilise la configuration publique déclarée dans `infra/console.public.json`.

## Démarrage

Prérequis : Node.js 22.12+, Python 3.12+ et Docker Desktop démarré. La CLI Supabase 3.2.0 a été utilisée via `npx` pour cette vérification locale ; l’équipe pourra choisir ensuite une version verrouillée. Aucun projet Supabase distant n’est lié. Depuis la racine du dépôt :

```powershell
npx.cmd --yes supabase@3.2.0 start
npx.cmd --yes supabase@3.2.0 migration up --local
npx.cmd --yes supabase@3.2.0 status -o env
```

`migration up --local` applique les migrations en attente sans vider les données. Pour vérifier le rejeu complet, `db reset` recrée la base **locale** et supprime ses données ; l’exécuter seulement sur une pile de test que l’on peut vider. Ne pas ajouter `--remote` ou `--linked` aux tests de ce guide.

Copier `.env.example` vers `.env` puis reporter **uniquement les clés de la pile locale** : la clé `ANON_KEY` (ou publishable locale) dans `VITE_SUPABASE_PUBLISHABLE_KEY` et `SUPABASE_PUBLISHABLE_KEY`, la clé `SERVICE_ROLE_KEY` (ou secret locale) dans `SUPABASE_SECRET_KEY`. Ne jamais préfixer la clé privilégiée par `VITE_`, ni la committer. Conserver les URL locales indiquées dans l’exemple.

Dans deux terminaux :

```powershell
py -3.12 -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -e 'backend[dev]'
backend/.venv/Scripts/python -m uvicorn app.main:app --app-dir backend --reload
```

```powershell
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run dev
```

## Accès et rôles

Créer au moins deux comptes de test distincts dans **Supabase Studio local → Authentication → Users** (`http://127.0.0.1:54323`). Dans l’éditeur SQL **local**, attribuer les rôles après création des comptes :

```sql
insert into public.internal_members (user_id, role)
select id, 'member' from auth.users where email = 'createur-local@example.test'
on conflict (user_id) do update set role = excluded.role;

insert into public.internal_members (user_id, role)
select id, 'publisher' from auth.users where email = 'relecteur-local@example.test'
on conflict (user_id) do update set role = excluded.role;
```

Ces adresses sont des exemples à remplacer. `member` crée et teste ; `reviewer` peut en plus relire ; `publisher` peut relire, publier et réactiver une ancienne version. Le créateur d’une version ne peut pas valider sa propre relecture. Les rôles sont gérés par SQL local pour ce premier lot ; aucune interface de gestion des membres n’est exposée.

L’API vérifie chaque jeton auprès de Supabase Auth, puis le RPC contrôle le rôle côté serveur. Les tables internes ont RLS activé et aucun droit d’accès direct pour `anon` ou `authenticated`. Les appels métier utilisent le jeton utilisateur ; les RPC contrôlés sont la seule entrée du navigateur. Une clé privilégiée ne sert qu’aux opérations d’administration côté serveur et aux fixtures locales. Une URL de console cachée ou un bouton masqué ne constitue pas une autorisation.

## Parcours vérifiable

1. Se connecter avec le compte `member`, créer un cas et saisir contexte, contraintes bloquantes, préférences, région et budget. Le cas est enregistré en brouillon et réapparaît dans la liste.
2. Lancer un test. Le résultat indique explicitement `simulation`, les informations manquantes, les hypothèses et la configuration `mock`. Il ne classe aucun fournisseur et ne chiffre aucun coût. Dix tests au plus sont acceptés par révision.
3. Soumettre la version testée à relecture. Se connecter avec un second compte doté du rôle `reviewer` ou `publisher`, valider la relecture. Un `publisher` peut publier la version.
4. Créer un nouveau brouillon depuis la version active et le modifier : la version active reste inchangée. Après nouveau test et relecture, publier le brouillon. Un `publisher` peut réactiver une version publiée antérieurement.

Les publications et retours en arrière sont des transactions PostgreSQL qui mettent à jour le pointeur de version active et la trace d’action ensemble. Les tests sont liés à l’identifiant de version et à sa révision ; un résultat devient périmé après une modification du brouillon.

## Contrats API

Toutes les routes ci-dessous sont sous `/api/v1/internal` et exigent `Authorization: Bearer <jeton Supabase Auth>`. Le contrôle de santé `/api/v1/health` reste public.

| Route | Rôle minimal | Effet |
| --- | --- | --- |
| `GET /me` | membre | Identité et rôle interne. |
| `GET /cases`, `GET /cases/{id}` | membre | Liste et détail, versions, tests et actions. |
| `POST /cases` | membre | Crée un cas et sa v1 en transaction. |
| `PATCH /cases/{id}/versions/{version_id}` | membre | Modifie un brouillon avec contrôle de révision. |
| `POST /cases/{id}/versions/{version_id}/tests` | membre | Enregistre un test simulé. |
| `POST /cases/{id}/versions/{version_id}/submit-review` | membre | Soumet une révision testée. |
| `POST /cases/{id}/versions/{version_id}/approve` | relecteur | Valide, sauf si auteur de la version. |
| `POST /cases/{id}/versions/{version_id}/publish` | publication | Active une version relue. |
| `POST /cases/{id}/drafts` | membre | Copie la version active dans un nouveau brouillon. |
| `POST /cases/{id}/versions/{version_id}/rollback` | publication | Réactive une ancienne version publiée. |

Les ateliers ajoutent les routes suivantes sous le même préfixe. La passerelle Edge expose les mêmes suffixes sous `/functions/v1/console-api/internal`.

| Route | Effet |
| --- | --- |
| `GET /workspace` | Vue d’ensemble autorisée, sans charger tous les textes. |
| `POST /workspace/items`, `GET/PATCH /workspace/items/{id}` | Créer, lire et modifier une contribution avec contrôle de révision. |
| `POST /workspace/items/{id}/review` ou `/archive` | Relire depuis un autre compte autorisé, ou archiver avec le rôle publisher. |
| `POST /workspace/search` | Recherche lexicale dans les sources non archivées. |
| `POST /workspace/releases`, `GET /workspace/releases/{id}` | Créer ou lire un instantané de consignes et sources. |
| `POST /workspace/releases/{id}/tests` | Enregistrer une recherche et une préparation de contexte simulée. |
| `POST /workspace/releases/{id}/approve`, `/activate`, `/rollback` | Validation distincte et activation/retour arrière transactionnels. |
| `GET /workspace/experiments/{id}` | Lire une expérience et ses passages figés. |
| `POST /workspace/experiments/{id}/evaluations` | Ajouter une évaluation humaine. |

## Vérifications reproductibles

- Rejouer `supabase db reset` puis vérifier les tables, fonctions et politiques dans Studio.
- Vérifier `401` sans jeton, `403` avec un compte Auth sans rôle interne, puis les interdictions de relecture/publication selon les rôles.
- Depuis un client Supabase connecté sans clé privilégiée, vérifier que les tables internes ne sont pas lisibles ni modifiables directement.
- Faire le parcours complet avec deux comptes distincts et constater que v1 active reste identique pendant la modification de v2.

Le parcours des cas a d’abord été vérifié le 17 novembre 2026 après rejeu des migrations sur une pile locale vierge. Le 20 novembre, la migration des ateliers a été appliquée localement et les **7 tests Python** ont réussi, avec création/récupération, tests simulés, relecture distincte, publication, retour arrière et contrat HTTP des ateliers. Les **10 tests Edge** ont réussi. Les scénarios PostgreSQL des ateliers ont vérifié les six types de contribution, les validations d’entrée, les conflits de révision, les instantanés, la recherche, l’évaluation, l’archivage et les refus de lecture/insertion/modification/suppression directes. Les fixtures sont supprimées après les essais.

Pour reproduire les contrôles Python et Node, voir [tests/README.md](../tests/README.md). Sans `RUN_LOCAL_SUPABASE_TESTS=1`, les tests Python intégrés sont ignorés. Le parcours Chrome a aussi été exécuté sur ordinateur et à une largeur mobile de 390 px : import de fichier, sauvegarde et rechargement, recherche, consignes, exemple, configuration, expérience, export Markdown, retour d’interface, évaluation, contrôle et validation depuis un second compte local. Aucun utilisateur ni contenu de test n’est créé sur le projet partagé.

## Limites et suite

Le dialogue public ne possède ni historique persistant, ni RAG, ni LLM réel. Le laboratoire mesure une recherche textuelle et recueille une appréciation humaine ; il ne produit pas une comparaison cloud. Les tests de ce guide n’utilisent que Supabase local. Le déploiement sur IA FOR CLOUD suit une [procédure distincte](deploiement-console-supabase.md), explicitement autorisée pour la console. Les modèles, les budgets, la conservation et le futur backend de conversation restent à décider et à implémenter.

Références d’API utilisées : [vérification du JWT avec `get_user`](https://supabase.com/docs/reference/python/auth-getuser), [retour des lignes modifiées](https://supabase.com/docs/reference/python/update), [fonctions PostgreSQL appelées par RPC](https://supabase.com/docs/reference/python/rpc).

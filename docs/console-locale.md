# Console interne : premier parcours local

## État réel

La console React est accessible à `http://127.0.0.1:5173/#/console` lorsque le frontend, l’API et Supabase local sont lancés. Une connexion Supabase Auth et un rôle dans `internal_members` sont nécessaires. Les cinq espaces sont visibles ; seul **Besoins & clouds** possède un parcours métier. Les quatre autres affichent « À développer ».

Le site public `ai-kora.cloud` reste une publication **statique** de l’interface Kora. Le dialogue y est une simulation locale au navigateur, sans analyse ni enregistrement. L’API FastAPI et Supabase ne sont pas déployés sur ce domaine. La route de la console y explique qu’elle n’est disponible que sur la pile locale. La configuration Vite charge `.env` pour `npm run dev` et désactive explicitement son chargement pour `npm run build`.

## Démarrage

Prérequis : Node.js 22.12+, Python 3.12+, Docker Desktop démarré et Supabase CLI. Aucun projet Supabase distant n’est lié. Depuis la racine du dépôt :

```powershell
supabase start
supabase db reset
supabase status -o env
```

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

L’API vérifie chaque jeton auprès de Supabase Auth puis cherche le rôle côté serveur. Les tables internes ont RLS activé et aucun droit d’accès direct pour `anon` ou `authenticated`. Seule la clé privilégiée **côté backend** accède à ces tables, après le contrôle de rôle. Une URL de console cachée ou un bouton masqué ne constitue pas une autorisation.

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

## Vérifications reproductibles

- Rejouer `supabase db reset` puis vérifier les tables, fonctions et politiques dans Studio.
- Vérifier `401` sans jeton, `403` avec un compte Auth sans rôle interne, puis les interdictions de relecture/publication selon les rôles.
- Depuis un client Supabase connecté sans clé privilégiée, vérifier que les tables internes ne sont pas lisibles ni modifiables directement.
- Faire le parcours complet avec deux comptes distincts et constater que v1 active reste identique pendant la modification de v2.

Le 17 novembre 2026, `supabase db reset` a rejoué les deux migrations sur une pile locale vierge. `python -m unittest discover -s backend/tests -v` a réussi avec **6 tests**, dont un parcours intégré avec trois comptes temporaires (membre, responsable de publication et compte sans rôle). Ce parcours a vérifié les refus 401/403, la création et la récupération du cas, le test simulé, la relecture par une autre personne, la publication, la création d’un nouveau brouillon sans effet sur la version active, puis le retour à l’ancienne version. Les essais Data API ont vérifié qu’un compte Auth normal ne peut ni lire, ni insérer, ni modifier, ni supprimer les cas internes. Les comptes de test et leur cas sont supprimés après l’essai.

Pour refaire ce contrôle, définir `RUN_LOCAL_SUPABASE_TESTS=1`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` et `SUPABASE_SECRET_KEY` à partir de **la pile locale uniquement**, puis exécuter la commande de tests ci-dessus. Sans `RUN_LOCAL_SUPABASE_TESTS`, le test intégré est ignoré. Le rendu visuel dans un navigateur reste à vérifier manuellement.

## Limites et suite

Le dialogue public ne possède ni historique persistant, ni RAG, ni LLM réel. Le test interne ne mesure pas la qualité des recommandations et ne constitue pas une comparaison cloud. La console n’est pas encore hébergée. Les appels privilégiés et les tests n’utilisent que la pile Supabase locale. Avant toute mise en ligne fonctionnelle, prévoir l’hébergement sécurisé de FastAPI et Supabase, des tests RLS à plusieurs comptes, une vraie politique de quotas, des tests d’intégration et la procédure de déploiement explicitement validée par l’équipe.

Références d’API utilisées : [vérification du JWT avec `get_user`](https://supabase.com/docs/reference/python/auth-getuser), [retour des lignes modifiées](https://supabase.com/docs/reference/python/update), [fonctions PostgreSQL appelées par RPC](https://supabase.com/docs/reference/python/rpc).

# Vérifications et tests

## Contrôles existants

Les contrôles portent sur les parcours implémentés : sessions et rôles, contributions, versions, recherche textuelle, simulations explicites et évaluations humaines. Ils ne mesurent pas la qualité d’un LLM réel. Le 20 novembre 2026 : compilation frontend réussie, 7 tests Python réussis, 10 tests Edge réussis, scénarios PostgreSQL des ateliers réussis et parcours Chrome ordinateur/mobile réussi.

## Compilation et passerelle Edge

Depuis la racine, avec Node.js 22.12+ et les dépendances frontend installées :

```powershell
npm.cmd --prefix frontend run build
node --experimental-strip-types --test tests/console-edge.test.mts
```

Les tests Edge utilisent des dépendances simulées sans contacter Supabase : JWT absent/refusé, CORS, routes autorisées, transmission du jeton utilisateur et des bons paramètres RPC, tailles de corps et erreurs. La limite des ateliers est de 250 000 octets ; celle des anciennes routes de cas reste de 16 000 octets.

## PostgreSQL et FastAPI sur Supabase local

Docker et la pile locale doivent être actifs, avec les migrations appliquées et les dépendances Python installées selon [le guide local](../docs/console-locale.md). Les scripts refusent les URL hébergées. Les clés restent en mémoire du processus ; ne pas les copier dans un fichier versionné.

```powershell
$taskStatus = npx.cmd --yes supabase@3.2.0 status -o env 2>$null
$taskLocal = @{}
foreach ($taskLine in $taskStatus) {
  if ($taskLine -match '^([A-Z_]+)=(.*)$') {
    $taskLocal[$Matches[1]] = $Matches[2].Trim('"')
  }
}
$env:SUPABASE_URL = $taskLocal['API_URL']
$env:SUPABASE_PUBLISHABLE_KEY = $taskLocal['PUBLISHABLE_KEY']
$env:SUPABASE_SECRET_KEY = $taskLocal['SERVICE_ROLE_KEY']
$env:RUN_LOCAL_SUPABASE_TESTS = '1'
backend/.venv/Scripts/python -m unittest discover -s backend/tests -v

@{
  url = $taskLocal['API_URL']
  public = $taskLocal['PUBLISHABLE_KEY']
  secret = $taskLocal['SERVICE_ROLE_KEY']
} | ConvertTo-Json -Compress | node tests/workspace-local.mjs
```

Le test Python appelle FastAPI dans son processus et Supabase local par HTTP. Pour vérifier aussi le parcours de cas via l’Edge Function locale, lancer `npx.cmd --yes supabase@3.2.0 functions serve console-api` et définir `CONSOLE_EDGE_URL=http://127.0.0.1:54321/functions/v1/console-api` avant la commande Python.

`workspace-local.mjs` crée quatre comptes locaux temporaires et des fixtures textuelles clairement fictives, puis vérifie six groupes de scénarios : accès, six types de contributions, conflits et instantanés, relecture/activation/retour arrière, recherche/évaluation/historique/archivage, et refus CRUD directs. Il nettoie ses enregistrements et comptes, puis restaure le pointeur actif antérieur le cas échéant.

## Parcours navigateur optionnel sur Windows

`workspace-ui.mjs` utilise Chrome déjà installé et un pilote Playwright temporaire, sans dépendance applicative ajoutée. Le parcours attend Vite sur `127.0.0.1:5173`, configuré avec l’URL et la clé publique **locales**, et l’Edge Function locale démarrée. Le pilote est préparé hors du dépôt :

```powershell
$taskBrowser = Join-Path $env:TEMP 'kora-browser-qa'
npm.cmd install --prefix $taskBrowser --no-save --package-lock=false --ignore-scripts playwright-core@1.65.1
$env:WORKSPACE_BROWSER_TEST = '1'
```

Relancer ensuite la commande Node ci-dessus. Le script utilise `C:/Program Files/Google/Chrome/Application/chrome.exe`. Il parcourt les cinq rubriques, importe un fichier, sauvegarde/recharge les données, lance une expérience, vérifie le téléchargement Markdown, les évaluations et la validation distincte. Il vérifie aussi les erreurs JavaScript et l’absence de débordement horizontal à 390 px. Les captures vont dans `.cache/`, ignoré par Git. Retirer `WORKSPACE_BROWSER_TEST` pour les contrôles API seuls.

## Travail restant

Les essais du futur dialogue connecté, de Storage, des quotas et de la génération réelle restent à écrire après choix des contrats et du modèle. La CI et les critères d’acceptation du MVP restent à fixer avec l’équipe. Les fixtures locales ne sont ni des sources cloud ni des preuves de qualité des futures recommandations.

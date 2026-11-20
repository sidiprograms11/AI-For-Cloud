import assert from 'node:assert/strict'
import { readFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'

// Chrome installé sur le poste et pilote temporaire ; aucune donnée de production.
export async function runBrowserChecks({ author, reviewer, password, rpc }) {
  const { chromium } = await import(pathToFileURL(join(tmpdir(), 'kora-browser-qa/node_modules/playwright-core/index.mjs')).href)
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, acceptDownloads: true })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const suffix = author.id.slice(0, 8)
  const sourceTitle = `Fixture navigateur ${suffix} cloud`
  const promptTitle = `Fixture navigateur ${suffix} consignes`
  const referenceTitle = `Fixture navigateur ${suffix} exemple`
  const releaseTitle = `Fixture navigateur ${suffix} configuration`
  const question = `interfacebleue${suffix}`
  const body = `Fixture locale sans information cloud réelle. Le mot-clé ${question} sert uniquement à vérifier la recherche documentaire et la persistance.`
  const primary = () => page.getByRole('navigation', { name: 'Espaces de travail' })
  const tabs = () => page.getByRole('navigation', { name: 'Outils de la rubrique' })
  const dialog = () => page.getByRole('dialog')
  async function save() {
    await dialog().getByRole('button', { name: 'Enregistrer le brouillon', exact: true }).click()
    await dialog().waitFor({ state: 'hidden' })
  }
  async function choose(select, text) {
    const value = await select.locator('option').filter({ hasText: text }).getAttribute('value')
    assert(value, `Option introuvable : ${text}`)
    await select.selectOption(value)
  }
  try {
    await page.goto('http://127.0.0.1:5173/#/console')
    await page.getByLabel('Adresse e-mail', { exact: true }).fill(author.email)
    await page.getByLabel('Mot de passe', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
    await page.getByRole('heading', { name: 'Bibliothèque CLOUD', exact: true }).waitFor()
    await page.getByRole('button', { name: /Ajouter une fiche cloud/ }).click()
    await dialog().getByLabel('Titre', { exact: true }).fill(sourceTitle)
    await dialog().getByLabel('Cloud concerné').selectOption('aws')
    await dialog().getByLabel('Provenance').selectOption('notes')
    await dialog().getByLabel(/Importer un texte/).setInputFiles({ name: 'connaissances-fixture.md', mimeType: 'text/markdown', buffer: Buffer.from(body) })
    await save()
    await page.getByRole('heading', { name: sourceTitle, exact: true }).waitFor()
    await page.reload()
    await page.getByRole('heading', { name: sourceTitle, exact: true }).waitFor()
    await page.locator('.contribution-card').filter({ hasText: sourceTitle }).getByRole('button', { name: 'Lire / modifier' }).click()
    assert.equal(await dialog().getByLabel(/^Contenu cloud/).inputValue(), body)
    await dialog().getByLabel(/^Contenu cloud/).fill(body + ' Modification vérifiée dans le navigateur.')
    await save()
    await page.getByPlaceholder('Un sujet, un service ou un mot-clé…').fill(question)
    await page.getByRole('button', { name: 'Chercher dans les contenus' }).click()
    await page.locator('.search-results').getByRole('button', { name: sourceTitle, exact: true }).waitFor()
    assert((await page.locator('.search-results article p').first().textContent()).includes(question))
    await page.getByPlaceholder('Un sujet, un service ou un mot-clé…').fill('')
    await mkdir('.cache', { recursive: true })
    await page.screenshot({ path: '.cache/console-cloud-desktop.png', fullPage: true })

    await primary().getByRole('button', { name: /IA & consignes/ }).click()
    await page.getByRole('button', { name: /Ajouter des consignes/ }).click()
    await dialog().getByLabel('Titre', { exact: true }).fill(promptTitle)
    await dialog().getByLabel(/^Consignes à donner à Kora/).fill('Fixture : répondre en français avec des sources et signaler les informations manquantes.')
    await save()
    await tabs().getByRole('button', { name: 'Questions & réponses attendues' }).click()
    await page.getByRole('button', { name: /Ajouter un exemple/ }).click()
    await dialog().getByLabel('Titre', { exact: true }).fill(referenceTitle)
    await dialog().getByLabel('Question de référence').fill(question)
    await dialog().getByLabel(/^Réponse attendue et critères de réussite/).fill('Fixture : citer le passage retrouvé et préciser les limites de cette simulation.')
    await save()
    await tabs().getByRole('button', { name: 'Laboratoire', exact: true }).click()
    await page.getByRole('button', { name: /Configuration candidate/ }).click()
    await dialog().getByLabel('Nom de la configuration').fill(releaseTitle)
    await choose(dialog().getByLabel('Consignes de réponse'), promptTitle)
    await dialog().locator('.source-selection label').filter({ hasText: sourceTitle }).getByRole('checkbox').check()
    await dialog().getByRole('button', { name: 'Enregistrer la configuration candidate' }).click()
    await dialog().waitFor({ state: 'hidden' })
    await choose(page.getByLabel('Configuration figée'), releaseTitle)
    await choose(page.getByLabel('Partir d’une question de référence'), referenceTitle)
    await page.waitForFunction((value) => [...document.querySelectorAll('textarea')].some((element) => element.value === value), question)
    await page.getByRole('button', { name: 'Lancer une expérience simulée' }).click()
    await page.locator('.lab-result .experiment-view').waitFor()
    await page.locator('.lab-result .retrieved-source').getByRole('heading', { name: sourceTitle }).waitFor()
    const downloadWait = page.waitForEvent('download')
    await page.getByRole('button', { name: /Exporter ce résultat en Markdown/ }).click()
    const download = await downloadWait
    const markdown = await readFile(await download.path(), 'utf8')
    assert(markdown.includes('SIMULATION'))
    assert(markdown.includes(sourceTitle))
    assert(markdown.includes(question))

    await primary().getByRole('button', { name: /Interface & restitution/ }).click()
    await choose(page.getByLabel('Expérience à consulter'), question)
    await page.locator('.experiment-view').getByRole('heading', { name: question, exact: true }).waitFor()
    await tabs().getByRole('button', { name: 'Retours d’interface' }).click()
    await page.getByRole('button', { name: /Ajouter un retour/ }).click()
    await dialog().getByLabel('Titre', { exact: true }).fill(`Fixture navigateur ${suffix} retour`)
    await dialog().getByLabel(/^Problème observé/).fill('Fixture : conserver les sources visibles pendant la lecture du résultat sur mobile.')
    await save()

    await primary().getByRole('button', { name: /Qualité & livraison/ }).click()
    await choose(page.getByLabel('Expérience évaluée'), question)
    await page.getByLabel('Utilité du contexte (1 à 5)').selectOption('4')
    await page.getByLabel('Pertinence des sources (1 à 5)').selectOption('3')
    await page.getByLabel('Observations, erreurs et améliorations').fill('Fixture navigateur : le contexte contient le passage attendu et sa provenance.')
    await page.getByRole('button', { name: 'Enregistrer l’évaluation' }).click()
    await page.getByText('Fixture navigateur : le contexte contient le passage attendu et sa provenance.', { exact: true }).waitFor()
    await tabs().getByRole('button', { name: 'Contrôles & preuves' }).click()
    await page.getByRole('button', { name: /Ajouter un contrôle/ }).click()
    await dialog().getByLabel('Titre', { exact: true }).fill(`Fixture navigateur ${suffix} contrôle`)
    await dialog().getByLabel('État déclaré').selectOption('passed')
    await dialog().getByLabel(/^Procédure, observations et preuve/).fill('Fixture : ce contrôle vérifie le formulaire, le statut déclaré et sa persistance.')
    await save()

    await primary().getByRole('button', { name: /Backend & versions/ }).click()
    const card = page.locator('.release-list > article').filter({ hasText: releaseTitle })
    await card.getByRole('button', { name: 'Consulter la configuration' }).click()
    await dialog().getByRole('button', { name: 'Valider la configuration' }).waitFor()
    assert(await dialog().getByRole('button', { name: 'Valider la configuration' }).isDisabled())
    await dialog().getByRole('button', { name: 'Fermer', exact: true }).click()
    const overview = await rpc(author, 'overview')
    const source = overview.items.find((entry) => entry.title === sourceTitle)
    const prompt = overview.items.find((entry) => entry.title === promptTitle)
    const release = overview.releases.find((entry) => entry.title === releaseTitle)
    await rpc(reviewer, 'review_item', source.id, { expected_revision: source.revision })
    await rpc(reviewer, 'review_item', prompt.id, { expected_revision: prompt.revision })
    await rpc(reviewer, 'approve_release', release.id)
    await rpc(reviewer, 'activate_release', release.id)
    await page.getByRole('button', { name: /Actualiser/ }).click()
    await page.locator('.active-configuration').getByRole('heading', { name: releaseTitle }).waitFor()
    await tabs().getByRole('button', { name: 'Journal d’activité' }).click()
    await page.getByText('Configuration activée', { exact: true }).first().waitFor()

    await page.setViewportSize({ width: 390, height: 844 })
    await primary().getByRole('button', { name: /Cloud & besoins/ }).click()
    await page.getByRole('heading', { name: 'Bibliothèque CLOUD', exact: true }).waitFor()
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Débordement horizontal sur mobile')
    await page.screenshot({ path: '.cache/console-cloud-mobile.png', fullPage: true })
    assert.deepEqual(errors, [], 'Erreurs JavaScript dans le navigateur')
  } catch (error) {
    await mkdir('.cache', { recursive: true })
    await page.screenshot({ path: '.cache/console-test-failure.png', fullPage: true }).catch(() => {})
    throw error
  } finally {
    await context.close()
    await browser.close()
  }
}

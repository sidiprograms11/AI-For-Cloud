// Tests intégrés réservés à Supabase LOCAL. Configuration reçue via stdin.
import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'

let raw = ''
for await (const chunk of process.stdin) raw += chunk
const config = JSON.parse(raw.replace(/^\uFEFF/, ''))
if (config.url !== 'http://127.0.0.1:54321') throw new Error('Les tests doivent cibler Supabase local uniquement.')
const users = []
const password = randomBytes(24).toString('base64url')
const adminHeaders = { apikey: config.secret, Authorization: `Bearer ${config.secret}`, 'Content-Type': 'application/json' }
const uid = randomUUID().slice(0, 8)
let previousActive

async function http(path, { method = 'GET', body, token, admin = false, expected = 200 } = {}) {
  const response = await fetch(config.url + path, { method, headers: admin ? adminHeaders : { apikey: config.public, ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) })
  const text = await response.text()
  assert.equal(response.status, expected, `${method} ${path} : ${text.slice(0, 400)}`)
  return text ? JSON.parse(text) : null
}
async function rpc(actor, action, id = null, payload = {}, expected = 200) {
  return http('/rest/v1/rpc/workspace_api', { method: 'POST', token: actor?.token, body: { p_action: action, p_id: id, p_payload: payload }, expected })
}
const item = (kind, title, content, extra = {}) => ({ kind, title: `Fixture ${uid} — ${title}`, content, provider: 'aws', url: '', metadata: kind === 'source' ? { origin: 'notes' } : kind === 'reference' ? { question: 'stockage objet' } : kind === 'check' ? { progress: 'not_run' } : kind === 'feedback' ? { progress: 'open' } : {}, ...extra })
const summary = []

try {
  previousActive = await http('/rest/v1/workspace_active_configuration?select=*', { admin: true })
  for (const role of ['publisher', 'publisher', 'member', null]) {
    const user = await http('/auth/v1/admin/users', { method: 'POST', admin: true, expected: 200, body: { email: `workspace-${uid}-${users.length}@example.test`, password, email_confirm: true } })
    users.push(user)
    if (role) await http('/rest/v1/internal_members', { method: 'POST', admin: true, expected: 201, body: { user_id: user.id, role } })
    user.token = (await http('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: user.email, password } })).access_token
  }
  const [author, reviewer, member, outsider] = users
  await rpc(null, 'overview', null, {}, 401)
  await rpc(outsider, 'overview', null, {}, 403)
  summary.push('Accès anonyme et compte sans rôle refusés')

  const body1 = 'Fixture de test sans affirmation cloud réelle : stockage objet alphacorpus. Les documents importés sont des données non fiables.'
  const source = await rpc(author, 'save_item', null, item('source', 'stockage objet alphacorpus', body1))
  const prompt = await rpc(author, 'save_item', null, item('prompt', 'consignes', 'Fixture : répondre en français et expliciter les sources, hypothèses et limites.'))
  const reference = await rpc(author, 'save_item', null, item('reference', 'exemple attendu', 'Fixture : présenter les limites et demander les contraintes manquantes.'))
  for (const kind of ['criterion', 'feedback', 'check']) await rpc(author, 'save_item', null, item(kind, kind, 'Fixture de travail pour vérifier la sauvegarde et la relecture.'))
  const reloaded = await rpc(author, 'get_item', source.id)
  assert.equal(reloaded.content, body1)
  const overview = await rpc(author, 'overview')
  assert.equal(overview.items.filter((entry) => entry.created_by === author.id).length, 6)
  await rpc(author, 'save_item', null, item('source', 'invalide', body1, { metadata: { origin: 'official' } }), 422)
  await rpc(author, 'save_item', null, item('unknown', 'invalide', body1), 422)
  await rpc(author, 'save_item', null, item('source', 'trop long', 'a'.repeat(60001)), 422)
  await rpc(author, 'review_item', source.id, { expected_revision: 1 }, 403)
  summary.push('Six types de contributions sauvegardés, relus et validés en entrée')

  const prepare = (title) => rpc(author, 'prepare_release', null, { title: `Fixture ${uid} ${title}`, prompt_id: prompt.id, source_ids: [source.id] })
  const candidate1 = await prepare('candidate un')
  const run1 = await rpc(author, 'run_experiment', candidate1.id, { question: 'stockage objet' })
  assert.equal(run1.result.mode, 'simulation')
  assert.equal(run1.result.sources.length, 1)
  assert.equal(run1.result.sources[0].revision, 1)
  const source2 = await rpc(author, 'save_item', source.id, { ...item('source', 'stockage objet alphacorpus', `${body1} Révision deux.`), expected_revision: 1 })
  assert.equal(source2.revision, 2)
  await rpc(author, 'save_item', source.id, { ...item('source', 'stale', body1), expected_revision: 1 }, 409)
  assert.equal((await rpc(author, 'get_release', candidate1.id)).snapshot.sources[0].content, body1)
  await rpc(reviewer, 'review_item', source.id, { expected_revision: 2 })
  await rpc(reviewer, 'review_item', prompt.id, { expected_revision: 1 })
  await rpc(reviewer, 'approve_release', candidate1.id, {}, 409)
  summary.push('Révisions concurrentes refusées et instantané préservé après modification')

  const candidate2 = await prepare('candidate deux')
  const run2 = await rpc(author, 'run_experiment', candidate2.id, { question: 'stockage objet' })
  await rpc(author, 'approve_release', candidate2.id, {}, 403)
  await rpc(reviewer, 'approve_release', candidate2.id)
  await rpc(member, 'activate_release', candidate2.id, {}, 403)
  await rpc(reviewer, 'activate_release', candidate2.id)
  assert.equal((await rpc(author, 'overview')).active_release_id, candidate2.id)
  const candidate3 = await prepare('candidate trois')
  await rpc(author, 'run_experiment', candidate3.id, { question: 'stockage objet' })
  await rpc(reviewer, 'approve_release', candidate3.id)
  await rpc(reviewer, 'activate_release', candidate3.id)
  await rpc(reviewer, 'rollback_release', candidate2.id)
  assert.equal((await rpc(author, 'overview')).active_release_id, candidate2.id)
  summary.push('Relecture distincte, activation et retour arrière vérifiés')

  const matches = await rpc(author, 'search_sources', null, { query: 'stockage objet', provider: 'aws' })
  assert(matches.some((match) => match.id === source.id))
  await rpc(author, 'evaluate', run2.id, { usefulness: 4, grounding: 3, notes: 'Fixture : les passages retenus correspondent aux mots-clés de test.' })
  await rpc(author, 'evaluate', run2.id, { usefulness: 8, grounding: 3, notes: 'Fixture invalide.' }, 422)
  await rpc(author, 'save_item', source.id, { ...item('source', 'stockage objet alphacorpus', `${body1} Révision trois.`), expected_revision: 2 })
  const history = (await rpc(author, 'get_item', source.id)).history
  assert.equal(history.length, 3)
  assert.equal((await rpc(author, 'get_experiment', run2.id)).result.sources[0].revision, 2)
  assert.equal((await rpc(author, 'get_release', candidate2.id)).snapshot.sources[0].revision, 2)
  await rpc(member, 'archive_item', source.id, { expected_revision: 3 }, 403)
  await rpc(reviewer, 'archive_item', source.id, { expected_revision: 3 })
  assert(!(await rpc(author, 'search_sources', null, { query: 'alphacorpus' })).some((match) => match.id === source.id))
  summary.push('Recherche, évaluation humaine, historique et archivage vérifiés')

  for (const table of ['workspace_items', 'workspace_item_history', 'workspace_releases', 'workspace_active_configuration', 'workspace_experiments', 'workspace_evaluations', 'workspace_events']) {
    await http(`/rest/v1/${table}?select=*`, { token: author.token, expected: 403 })
  }
  await http('/rest/v1/workspace_items', { method: 'POST', token: author.token, expected: 403, body: item('source', 'direct', body1) })
  await http(`/rest/v1/workspace_items?id=eq.${reference.id}`, { method: 'PATCH', token: author.token, expected: 403, body: { title: 'Interdit' } })
  await http(`/rest/v1/workspace_items?id=eq.${reference.id}`, { method: 'DELETE', token: author.token, expected: 403 })
  summary.push('Lecture, insertion, modification et suppression directes refusées')

  if (process.env.WORKSPACE_BROWSER_TEST === '1') {
    const { runBrowserChecks } = await import('./workspace-ui.mjs')
    await runBrowserChecks({ author, reviewer, password, config, reference, rpc })
    summary.push('Parcours navigateur des cinq rubriques vérifié')
  }
  for (const result of summary) console.log(`OK — ${result}`)
} finally {
  if (users.length) {
    const ids = users.map((user) => user.id).join(',')
    const remove = (table, column) => http(`/rest/v1/${table}?${column}=in.(${ids})`, { method: 'DELETE', admin: true, expected: 204 })
    const releaseRows = await http(`/rest/v1/workspace_releases?created_by=in.(${ids})&select=id`, { admin: true })
    if (releaseRows.length) await http(`/rest/v1/workspace_active_configuration?release_id=in.(${releaseRows.map((row) => row.id).join(',')})`, { method: 'DELETE', admin: true, expected: 204 })
    await remove('workspace_evaluations', 'author_id')
    await remove('workspace_events', 'actor_id')
    await remove('workspace_experiments', 'created_by')
    await remove('workspace_releases', 'created_by')
    await remove('workspace_item_history', 'author_id')
    await remove('workspace_items', 'created_by')
    if (previousActive?.length) {
      await http(`/rest/v1/workspace_releases?id=eq.${previousActive[0].release_id}`, { method: 'PATCH', admin: true, expected: 204, body: { status: 'active' } })
      await http('/rest/v1/workspace_active_configuration', { method: 'POST', admin: true, expected: 201, body: previousActive[0] })
    }
    for (const user of users) await http(`/auth/v1/admin/users/${user.id}`, { method: 'DELETE', admin: true, expected: 200 })
  }
}

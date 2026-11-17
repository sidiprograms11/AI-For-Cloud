import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHandler, resolveRoute } from '../supabase/functions/console-api/handler.ts'

const environment = { url: 'http://127.0.0.1:54321', publicKey: 'test-public', allowedOrigins: ['https://ai-kora.cloud'] }
const url = 'https://example.supabase.co/functions/v1/console-api/internal/me'

test('le routage refuse les chemins et méthodes non prévus', () => {
  assert.equal(resolveRoute('DELETE', '/internal/cases'), null)
  assert.equal(resolveRoute('POST', '/internal/sql'), null)
  assert.equal(resolveRoute('PATCH', '/internal/cases/not-a-uuid'), null)
})

test('un appel sans session est refusé avant tout accès réseau', async () => {
  const handler = createHandler(environment, (() => { throw new Error('Accès réseau interdit') }) as typeof fetch)
  assert.equal((await handler(new Request(url))).status, 401)
})

test('une origine étrangère est refusée', async () => {
  const handler = createHandler(environment)
  const response = await handler(new Request(url, { headers: { origin: 'https://other.example', authorization: 'Bearer token' } }))
  assert.equal(response.status, 403)
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), null)
})

test('la prérequête CORS autorisée ne nécessite pas de session', async () => {
  const response = await createHandler(environment)(new Request(url, { method: 'OPTIONS', headers: { origin: 'https://ai-kora.cloud' } }))
  assert.equal(response.status, 204)
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://ai-kora.cloud')
})

test('une session expirée est refusée sans requête métier', async () => {
  let calls = 0
  const handler = createHandler(environment, (async () => { calls++; return Response.json({}, { status: 401 }) }) as typeof fetch)
  assert.equal((await handler(new Request(url, { headers: { authorization: 'Bearer invalid' } }))).status, 401)
  assert.equal(calls, 1)
})

test('le JWT utilisateur est transmis au RPC et son refus est conservé', async () => {
  const calls: string[] = []
  const handler = createHandler(environment, (async (input, init) => {
    calls.push(String(input))
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer member-token')
    if (String(input).endsWith('/auth/v1/user')) return Response.json({ id: 'user' })
    assert.equal(JSON.parse(String(init?.body)).p_action, 'me')
    return Response.json({ code: 'PT403', message: 'Accès interne refusé.' }, { status: 403 })
  }) as typeof fetch)
  const response = await handler(new Request(url, { headers: { authorization: 'Bearer member-token' } }))
  assert.equal(response.status, 403)
  assert.equal((await response.json()).detail, 'Accès interne refusé.')
  assert.equal(calls.length, 2)
})

test('aucun diagnostic interne de la base n’est exposé', async () => {
  const handler = createHandler(environment, (async (input) => String(input).endsWith('/auth/v1/user')
    ? Response.json({ id: 'user' })
    : Response.json({ code: 'XX000', message: 'private connection details' }, { status: 500 })) as typeof fetch)
  const response = await handler(new Request(url, { headers: { authorization: 'Bearer token' } }))
  assert.equal(response.status, 503)
  assert.equal((await response.text()).includes('private connection details'), false)
})

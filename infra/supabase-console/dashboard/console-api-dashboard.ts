// Généré depuis supabase/functions/console-api par infra/prepare_console_dashboard.py.
// Coller dans index.ts de la fonction EXISTANTE console-api, puis Deploy updates.
// Conserver la vérification JWT activée. Aucune clé à ajouter ici.

const workspaceUuid = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'

export function resolveWorkspaceRoute(method: string, path: string) {
  if (method === 'GET' && path === '/internal/workspace') return { action: 'overview' }
  if (method === 'POST' && path === '/internal/workspace/search') return { action: 'search_sources' }
  if (method === 'POST' && path === '/internal/workspace/items') return { action: 'save_item' }
  if (method === 'POST' && path === '/internal/workspace/releases') return { action: 'prepare_release' }
  const item = path.match(new RegExp(`^/internal/workspace/items/(${workspaceUuid})(?:/(review|archive))?$`))
  if (item) {
    if (!item[2] && method === 'GET') return { action: 'get_item', resourceId: item[1] }
    if (!item[2] && method === 'PATCH') return { action: 'save_item', resourceId: item[1] }
    if (item[2] && method === 'POST') return { action: `${item[2]}_item`, resourceId: item[1] }
  }
  const release = path.match(new RegExp(`^/internal/workspace/releases/(${workspaceUuid})(?:/(tests|approve|activate|rollback))?$`))
  if (release) {
    if (!release[2] && method === 'GET') return { action: 'get_release', resourceId: release[1] }
    if (release[2] && method === 'POST') return { action: release[2] === 'tests' ? 'run_experiment' : `${release[2]}_release`, resourceId: release[1] }
  }
  const experiment = path.match(new RegExp(`^/internal/workspace/experiments/(${workspaceUuid})(/evaluations)?$`))
  if (experiment) {
    if (!experiment[2] && method === 'GET') return { action: 'get_experiment', resourceId: experiment[1] }
    if (experiment[2] && method === 'POST') return { action: 'evaluate', resourceId: experiment[1] }
  }
  return null
}

type Environment = { url: string; publicKey: string; allowedOrigins: string[] }

const uuid = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'

export function resolveRoute(method: string, path: string) {
  const workspace = resolveWorkspaceRoute(method, path)
  if (workspace) return { ...workspace, workspace: true }
  if (method === 'GET' && path === '/internal/me') return { action: 'me' }
  if (path === '/internal/cases') {
    if (method === 'GET') return { action: 'list' }
    if (method === 'POST') return { action: 'create' }
  }
  const caseMatch = path.match(new RegExp(`^/internal/cases/(${uuid})(/drafts)?$`))
  if (caseMatch && method === (caseMatch[2] ? 'POST' : 'GET')) {
    return { action: caseMatch[2] ? 'draft' : 'get', caseId: caseMatch[1] }
  }
  const versionMatch = path.match(new RegExp(`^/internal/cases/(${uuid})/versions/(${uuid})(?:/(tests|submit-review|approve|publish|rollback))?$`))
  if (versionMatch && method === (versionMatch[3] ? 'POST' : 'PATCH')) {
    return { action: versionMatch[3] === 'tests' ? 'test' : versionMatch[3] ?? 'edit', caseId: versionMatch[1], versionId: versionMatch[2] }
  }
  return null
}

export function createHandler(env: Environment, requestFetch: typeof fetch = fetch) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin')
    const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Origin' })
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })
    if (origin && !env.allowedOrigins.includes(origin)) return json({ detail: 'Origine non autorisée.' }, 403)
    if (origin) headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Headers', 'authorization, apikey, content-type, x-client-info')
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
    const auth = request.headers.get('authorization')
    if (!auth?.match(/^Bearer\s+\S+$/)) return json({ detail: 'Connexion requise.' }, 401)
    if (!env.url || !env.publicKey) return json({ detail: 'Service non configuré.' }, 503)
    const path = new URL(request.url).pathname.replace(/^.*\/console-api/, '').replace(/\/$/, '')
    const route = resolveRoute(request.method, path)
    if (!route) return json({ detail: 'Opération introuvable.' }, 404)
    const requestId = crypto.randomUUID()
    headers.set('X-Request-Id', requestId)
    try {
      const authResponse = await requestFetch(`${env.url}/auth/v1/user`, {
        headers: { apikey: env.publicKey, Authorization: auth }, signal: AbortSignal.timeout(8000),
      })
      if (!authResponse.ok) return json({ detail: authResponse.status >= 500 ? 'Service d’identité indisponible.' : 'Session invalide.' }, authResponse.status >= 500 ? 503 : 401)
      let payload: unknown = {}
      if (request.method !== 'GET') {
        const maxBytes = 'workspace' in route ? 250000 : 16000
        if (Number(request.headers.get('content-length')) > maxBytes) return json({ detail: 'Données trop volumineuses.' }, 413)
        const text = await request.text()
        if (new TextEncoder().encode(text).length > maxBytes) return json({ detail: 'Données trop volumineuses.' }, 413)
        try { payload = text ? JSON.parse(text) : {} } catch { return json({ detail: 'JSON invalide.' }, 422) }
        if (!payload || Array.isArray(payload) || typeof payload !== 'object') return json({ detail: 'Objet JSON attendu.' }, 422)
      }
      const workspace = 'workspace' in route
      const rpcBody = workspace
        ? { p_action: route.action, p_id: 'resourceId' in route ? route.resourceId : null, p_payload: payload }
        : { p_action: route.action, p_case_id: 'caseId' in route ? route.caseId : null, p_version_id: 'versionId' in route ? route.versionId : null, p_payload: payload }
      const response = await requestFetch(`${env.url}/rest/v1/rpc/${workspace ? 'workspace_api' : 'console_api'}`, {
        method: 'POST',
        headers: { apikey: env.publicKey, Authorization: auth, 'Content-Type': 'application/json' },
        body: JSON.stringify(rpcBody),
        signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) {
        const error = await response.json() as { code?: string; message?: string }
        const status = /^PT(401|403|404|409|422|429)$/.test(error.code ?? '') ? Number(error.code?.slice(2)) : 503
        return json({ detail: status === 503 ? 'Données internes indisponibles.' : error.message, request_id: requestId }, status)
      }
      const data = await response.json()
      return json(data, ['create', 'draft', 'test', 'prepare_release', 'run_experiment', 'evaluate'].includes(route.action) || (route.action === 'save_item' && request.method === 'POST') ? 201 : 200)
    } catch {
      return json({ detail: 'Service temporairement indisponible.', request_id: requestId }, 503)
    }
  }
}

const namedKeys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}')
const publicKey = namedKeys.default || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || ''

Deno.serve(createHandler({
  url: Deno.env.get('SUPABASE_URL') || '',
  publicKey,
  allowedOrigins: (Deno.env.get('CONSOLE_ALLOWED_ORIGINS') || 'https://ai-kora.cloud,https://www.ai-kora.cloud,https://kora-ai-for-cloud-prototype.sidigano8.chatgpt.site,http://127.0.0.1:5173,http://localhost:5173').split(',').map((value) => value.trim()).filter(Boolean),
}))

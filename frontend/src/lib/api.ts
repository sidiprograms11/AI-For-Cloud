const configuredBase = import.meta.env.VITE_API_BASE_URL
const apiBaseUrl = configuredBase || (import.meta.env.DEV ? 'http://127.0.0.1:8000/api/v1' : '')

export const internalApiConfigured = Boolean(apiBaseUrl)

export async function internalRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  if (!apiBaseUrl) throw new Error('API interne indisponible sur cette publication statique.')
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
  })
  if (!response.ok) {
    let detail = `Erreur ${response.status}`
    try {
      const body = await response.json() as { detail?: string }
      if (typeof body.detail === 'string') detail = body.detail
    } catch { /* Réponse non JSON. */ }
    throw new Error(detail)
  }
  return response.json() as Promise<T>
}

export async function getApiHealth(): Promise<'available' | 'unavailable'> {
  if (!apiBaseUrl) return 'unavailable'
  try {
    const response = await fetch(`${apiBaseUrl}/health`, { signal: AbortSignal.timeout(2500) })
    return response.ok ? 'available' : 'unavailable'
  } catch { return 'unavailable' }
}

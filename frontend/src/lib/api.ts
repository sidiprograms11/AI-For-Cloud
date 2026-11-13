const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1'

export type HealthStatus = 'available' | 'unavailable'

export async function getApiHealth(): Promise<HealthStatus> {
  try {
    const response = await fetch(`${apiBaseUrl}/health`, { signal: AbortSignal.timeout(2500) })
    return response.ok ? 'available' : 'unavailable'
  } catch {
    return 'unavailable'
  }
}

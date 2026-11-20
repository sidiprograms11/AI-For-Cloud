import { lazy, Suspense, useEffect, useState } from 'react'
import PublicKora from './PublicKora'

const InternalConsole = lazy(() => import('./Console'))

function isConsoleRoute() {
  const hash = window.location.hash
  return hash.startsWith('#/console') || (hash !== '#/' && new URLSearchParams(window.location.search).get('console') === '1') || /access_token=/.test(hash)
}

export default function App() {
  const [consoleRoute, setConsoleRoute] = useState(isConsoleRoute)
  useEffect(() => {
    const update = () => setConsoleRoute(isConsoleRoute())
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  return consoleRoute ? <Suspense fallback={<div className="loading-page">Chargement de la console…</div>}><InternalConsole /></Suspense> : <PublicKora />
}

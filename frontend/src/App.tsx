import { useEffect, useState } from 'react'
import InternalConsole from './Console'
import PublicKora from './PublicKora'

export default function App() {
  const [consoleRoute, setConsoleRoute] = useState(window.location.hash.startsWith('#/console'))
  useEffect(() => {
    const update = () => setConsoleRoute(window.location.hash.startsWith('#/console'))
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  return consoleRoute ? <InternalConsole /> : <PublicKora />
}

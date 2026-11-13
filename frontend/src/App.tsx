import { useEffect, useState } from 'react'
import { getApiHealth, type HealthStatus } from './lib/api'
import { supabase } from './lib/supabase'

function Status({ label, ready }: { label: string; ready: boolean }) {
  return (
    <li className="status-item">
      <span className={`status-dot${ready ? ' is-ready' : ''}`} aria-hidden="true" />
      <span>{label}</span>
      <span className="status-value">{ready ? 'Configuré' : 'À configurer'}</span>
    </li>
  )
}

export default function App() {
  const [apiHealth, setApiHealth] = useState<HealthStatus>('unavailable')

  useEffect(() => {
    void getApiHealth().then(setApiHealth)
  }, [])

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#accueil" aria-label="Kora, accueil">
          <span className="brand-mark" aria-hidden="true">K</span>
          <span>Kora</span>
        </a>
        <span className="project-label">AI for Cloud</span>
      </header>

      <section className="welcome" id="accueil" aria-labelledby="welcome-title">
        <p className="eyebrow">Votre assistant de décision cloud</p>
        <h1 id="welcome-title">Une architecture cloud commence par vos besoins.</h1>
        <p className="intro">
          Kora vous guidera pour préciser votre projet, comparer AWS, Azure et Google Cloud,
          puis comprendre les compromis d’une architecture adaptée.
        </p>

        <div className="notice" role="status">
          <span className="notice-icon" aria-hidden="true">i</span>
          <p>Le parcours de conseil est en cours de développement. Aucune recommandation n’est générée pour le moment.</p>
        </div>
      </section>

      <section className="status-card" aria-labelledby="status-title">
        <div className="status-heading">
          <div>
            <p className="eyebrow">Environnement local</p>
            <h2 id="status-title">État des composants</h2>
          </div>
          <span className="mode-badge">Mode IA simulé</span>
        </div>
        <ul className="status-list">
          <Status label="API FastAPI" ready={apiHealth === 'available'} />
          <Status label="Configuration Supabase" ready={supabase !== null} />
        </ul>
      </section>

      <footer className="page-footer">
        Prototype de fin d’études · Efrei · CSIG
      </footer>
    </main>
  )
}

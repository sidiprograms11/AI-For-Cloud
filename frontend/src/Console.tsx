import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import Brand from './components/Brand'
import PasswordSettings from './components/PasswordSettings'
import ConsoleCases, { type Role } from './ConsoleCases'
import { internalApiConfigured, internalRequest } from './lib/api'
import { supabase } from './lib/supabase'

type Space = 'cases' | 'knowledge' | 'backend' | 'experience' | 'quality'

const spaces: { id: Space; label: string; description: string; number: string }[] = [
  { id: 'cases', number: '01', label: 'Besoins & clouds', description: 'Cas d’entreprise, contraintes et scénarios de comparaison.' },
  { id: 'knowledge', number: '02', label: 'IA & connaissances', description: 'Sources, prompts, corpus et évaluations du système.' },
  { id: 'backend', number: '03', label: 'Backend & recommandations', description: 'Contrats, règles, exécutions et configurations.' },
  { id: 'experience', number: '04', label: 'Interface & restitution', description: 'Aperçus de réponses, dossiers et retours utilisateurs.' },
  { id: 'quality', number: '05', label: 'Qualité & livraison', description: 'Tests, sécurité, versions et suivi de publication.' },
]

function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!supabase) { setReady(true); return }
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])
  return { session, ready }
}

function ConsoleLogin({ onError }: { onError: (message: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  async function sendLink() {
    if (!supabase || !email.trim()) { onError('Saisis ton adresse e-mail.'); return }
    setBusy(true); onError(''); setNotice('')
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false, emailRedirectTo: window.location.origin + '/?console=1' } })
      if (error) onError('Envoi impossible. Vérifie que ton compte est autorisé et que la messagerie est configurée.')
      else setNotice('Si ce compte est autorisé, un lien de connexion arrive par e-mail.')
    } catch { onError('Le service de connexion est indisponible.') }
    finally { setBusy(false) }
  }
  async function login(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true); onError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) onError('Connexion impossible. Vérifie tes identifiants.')
    } catch { onError('Le service de connexion est indisponible.') }
    finally { setBusy(false) }
  }
  return <div className="login-page"><a className="back-link" href="#/">← Retour à Kora</a><div className="login-card"><Brand /><span className="eyebrow">Espace réservé à l’équipe</span><h1>Console interne</h1><p>Connecte-toi avec ton compte autorisé. Les droits sont vérifiés par l’API à chaque opération.</p><form onSubmit={login} className="stacked-form"><label>Adresse e-mail<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label><label>Mot de passe<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label><button className="primary-button" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button><button type="button" className="outline-button" disabled={busy} onClick={() => void sendLink()}>Recevoir un lien par e-mail</button>{notice && <p role="status">{notice}</p>}</form></div></div>
}

export default function InternalConsole() {
  const { session, ready } = useSession()
  const [space, setSpace] = useState<Space>('cases')
  const [member, setMember] = useState<{ user_id: string; role: Role } | null>(null)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  useEffect(() => {
    if (!session) { setMember(null); return }
    setChecking(true); setError('')
    void internalRequest<{ user_id: string; role: Role }>('/internal/me', session.access_token).then(setMember).catch((cause) => setError(cause instanceof Error ? cause.message : 'Accès impossible.')).finally(() => setChecking(false))
  }, [session])
  if (!ready) return <div className="loading-page">Chargement de la session…</div>
  if (!supabase || !internalApiConfigured) return <div className="login-page"><a className="back-link" href="#/">← Retour à Kora</a><div className="login-card"><Brand /><h1>Console interne</h1><p>La connexion de la console est en cours de configuration. Réessaie après la mise en service.</p></div></div>
  if (!session) return <><ConsoleLogin onError={setError} />{error && <div className="login-error" role="alert">{error}</div>}</>
  if (checking) return <div className="loading-page">Vérification des droits…</div>
  if (!member) return <div className="login-page"><a className="back-link" href="#/">← Retour à Kora</a><div className="login-card"><Brand /><h1>Accès refusé</h1><p>{error || 'Ton compte n’a pas de rôle interne.'}</p><button className="outline-button" onClick={() => void supabase?.auth.signOut()}>Se déconnecter</button></div></div>
  const selectedSpace = spaces.find((item) => item.id === space)!
  return <div className="console-shell"><aside className="console-sidebar"><div className="console-brand"><Brand compact /><span>Console interne</span></div><nav aria-label="Espaces de travail">{spaces.map((item) => <button key={item.id} className={space === item.id ? 'active' : ''} onClick={() => setSpace(item.id)}><small>{item.number}</small>{item.label}</button>)}</nav><div className="console-sidebar-bottom"><span>Rôle : {member.role}</span><a href="#/">Voir Kora ↗</a><PasswordSettings /><button onClick={() => void supabase?.auth.signOut()}>Se déconnecter</button></div></aside><main className="console-main"><header className="console-top"><div><span className="eyebrow">Espace de travail · {selectedSpace.number}</span><h1>{selectedSpace.label}</h1><p>{selectedSpace.description}</p></div><span className="local-badge">{import.meta.env.DEV ? 'Développement local' : 'Espace équipe'}</span></header>{space === 'cases' ? <ConsoleCases token={session.access_token} role={member.role} /> : <div className="placeholder-panel"><span className="eyebrow">{selectedSpace.number} / 05</span><h2>À développer</h2><p>{selectedSpace.description}</p><p>Ce module sera relié aux mêmes droits et contrats que le parcours des cas d’entreprise.</p></div>}</main></div>
}

import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import './account-settings.css'

export default function PasswordSettings() {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    if (password !== confirmation) { setMessage('Les mots de passe ne correspondent pas.'); return }
    setBusy(true); setMessage('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) setMessage('Modification impossible. Réessaie après une nouvelle connexion.')
      else { setPassword(''); setConfirmation(''); setMessage('Mot de passe enregistré.') }
    } catch { setMessage('Service indisponible. Réessaie plus tard.') }
    finally { setBusy(false) }
  }
  return <details className="account-settings"><summary>Définir mon mot de passe</summary><form onSubmit={submit}>
    <label>Nouveau mot de passe<input type="password" minLength={12} required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
    <label>Confirmation<input type="password" minLength={12} required autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
    <button disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
    {message && <p role="status">{message}</p>}
  </form></details>
}

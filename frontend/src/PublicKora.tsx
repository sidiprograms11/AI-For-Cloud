import { useState, type FormEvent } from 'react'
import Brand from './components/Brand'

type Message = { id: number; role: 'user' | 'assistant'; text: string }

export default function PublicKora() {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) { setError('Écris quelques mots pour commencer.'); return }
    if (text.length > 2000) { setError('Le message doit contenir au plus 2 000 caractères.'); return }
    setError('')
    setDraft('')
    setMessages((current) => [...current, { id: Date.now(), role: 'user', text }])
    setBusy(true)
    await new Promise((resolve) => window.setTimeout(resolve, 450))
    setMessages((current) => [...current, {
      id: Date.now() + 1,
      role: 'assistant',
      text: 'Mode démonstration : votre message reste dans ce navigateur. Kora n’analyse pas encore le besoin et ne produit aucune recommandation. Pour préparer le futur parcours, quel est votre objectif métier et quelles contraintes sont incontournables ?',
    }])
    setBusy(false)
  }

  return <div className="public-shell">
    <aside className="public-rail">
      <div className="rail-brand"><Brand compact /></div>
      <button className="rail-new" onClick={() => { setMessages([]); setDraft(''); setError('') }}><span>＋</span> Nouvelle conversation</button>
      <div className="rail-section"><span>Cette session</span><p>Les échanges de démonstration ne sont pas enregistrés.</p></div>
      <div className="rail-bottom"><span className="demo-status"><i /> Prototype en cours</span><a href="#/console">Espace équipe <span aria-hidden="true">↗</span></a></div>
    </aside>
    <main className="public-main">
      <header className="public-top"><Brand /><span className="top-tag">Aperçu conversationnel</span></header>
      <div className="conversation-area">
        {messages.length === 0 ? <section className="empty-chat">
          <div className="empty-mark"><img src="/brand/kora-cloud.png" alt="" /></div>
          <span className="eyebrow">Kora · AI for Cloud</span>
          <h1>Parlons de votre<br /><em>projet cloud.</em></h1>
          <p>Décrivez votre contexte en quelques mots. Cette interface est une démonstration visuelle : l’analyse et les recommandations seront ajoutées progressivement.</p>
          <div className="starter-prompts" aria-label="Exemples de questions">
            {['Présenter mon besoin cloud', 'Identifier mes contraintes', 'Comprendre le futur dossier'].map((prompt) => <button key={prompt} onClick={() => setDraft(prompt)}>{prompt}<span aria-hidden="true">↗</span></button>)}
          </div>
        </section> : <div className="message-list" aria-live="polite">
          {messages.map((message) => <div className={`message message-${message.role}`} key={message.id}>
            <span className="message-avatar">{message.role === 'assistant' ? <img src="/brand/kora-cloud.png" alt="" /> : 'V'}</span>
            <div><strong>{message.role === 'assistant' ? 'Kora · simulation' : 'Vous'}</strong><p>{message.text}</p></div>
          </div>)}
          {busy && <div className="message message-assistant"><span className="message-avatar"><img src="/brand/kora-cloud.png" alt="" /></span><div><strong>Kora · simulation</strong><p className="typing">Préparation de la réponse <span>•••</span></p></div></div>}
        </div>}
      </div>
      <div className="composer-wrap"><form className="composer" onSubmit={submit}>
        <label className="sr-only" htmlFor="chat-message">Votre message</label>
        <textarea id="chat-message" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} placeholder="Décrivez votre projet ou posez une question…" rows={2} maxLength={2001} disabled={busy} />
        <button type="submit" disabled={busy} aria-label="Envoyer le message">↑</button>
      </form><div className="composer-note"><span>Démo locale · aucun message transmis au serveur</span><span>{draft.length}/2000</span></div>{error && <p className="form-error" role="alert">{error}</p>}</div>
    </main>
  </div>
}

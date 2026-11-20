import { useState, type FormEvent } from 'react'
import type { Role } from '../ConsoleCases'
import { Modal, State, EmptyState, dateLabel, type Workspace } from './shared'
import { kindLabels, progressLabels, providers, type Item, type ItemFields, type Kind, type Provider, type SourceExcerpt } from './types'

function ItemEditor({ kind, item, workspace, close }: { kind: Kind; item: Item | null; workspace: Workspace; close: () => void }) {
  const label = kindLabels[kind]
  const [fields, setFields] = useState<ItemFields>(item ? {
    kind, provider: item.provider, title: item.title, content: item.content ?? '', url: item.url, metadata: { ...item.metadata },
  } : { kind, provider: 'multi', title: '', content: '', url: '', metadata: kind === 'source' ? { origin: 'team' } : kind === 'check' ? { progress: 'not_run' } : kind === 'feedback' ? { progress: 'open' } : {} })
  const [fileError, setFileError] = useState('')
  const [pastRevision, setPastRevision] = useState('')
  const meta = (key: string, value: string) => setFields((current) => ({ ...current, metadata: { ...current.metadata, [key]: value } }))
  async function importText(file?: File) {
    if (!file) return
    setFileError('')
    if (!/\.(txt|md)$/i.test(file.name) || file.size > 102400) { setFileError('Choisis un fichier .txt ou .md de 100 Ko maximum.'); return }
    try {
      const content = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer())
      if (content.length > 60000) { setFileError('Le texte dépasse 60 000 caractères. Réduis-le ou répartis-le en plusieurs fiches.'); return }
      setFields((current) => ({ ...current, content, metadata: { ...current.metadata, imported_filename: file.name } }))
    } catch { setFileError('Le fichier doit contenir du texte UTF-8 lisible.') }
  }
  async function save(event: FormEvent) {
    event.preventDefault()
    const result = await workspace.act<Item>('Contribution enregistrée dans l’espace de l’équipe.', item ? `/items/${item.id}` : '/items', { ...fields, ...(item ? { expected_revision: item.revision } : {}) }, item ? 'PATCH' : 'POST')
    if (result) close()
  }
  const historical = item?.history?.find((entry) => String(entry.revision) === pastRevision)
  return <Modal title={item ? `${label.singular} · révision ${item.revision}` : `Ajouter : ${label.singular.toLowerCase()}`} close={close}>
    <form className="workspace-form" onSubmit={save}>
      {workspace.error && <p className="alert error wide" role="alert">{workspace.error}</p>}
      <label className="wide">Titre<input autoFocus required minLength={3} maxLength={160} value={fields.title} onChange={(event) => setFields({ ...fields, title: event.target.value })} placeholder="Un titre précis pour retrouver cette contribution" /></label>
      {['source', 'criterion', 'reference'].includes(kind) && <label>Cloud concerné<select value={fields.provider} onChange={(event) => setFields({ ...fields, provider: event.target.value as Provider })}>{Object.entries(providers).map(([value, text]) => <option value={value} key={value}>{text}</option>)}</select></label>}
      {kind === 'source' && <><label>Provenance<select value={fields.metadata.origin} onChange={(event) => meta('origin', event.target.value)}><option value="team">Contribution de l’équipe</option><option value="official">Documentation officielle</option><option value="notes">Notes à vérifier</option></select></label><label>Famille / sujet<input maxLength={120} value={fields.metadata.family ?? ''} onChange={(event) => meta('family', event.target.value)} placeholder="Ex. stockage, calcul, sécurité" /></label><label>Date de vérification déclarée<input type="date" value={fields.metadata.checked_on ?? ''} onChange={(event) => meta('checked_on', event.target.value)} /></label></>}
      {['source', 'criterion', 'check'].includes(kind) && <label className="wide">URL de référence {kind === 'source' && fields.metadata.origin === 'official' ? '(obligatoire)' : '(facultative)'}<input type="url" maxLength={2000} required={kind === 'source' && fields.metadata.origin === 'official'} value={fields.url} onChange={(event) => setFields({ ...fields, url: event.target.value })} placeholder="https://…" /><small>Le lien est conservé ; aucun contenu n’est téléchargé automatiquement.</small></label>}
      {kind === 'criterion' && <label>Nature du critère<select value={fields.metadata.criterion_type ?? 'blocking'} onChange={(event) => meta('criterion_type', event.target.value)}><option value="blocking">Contrainte bloquante</option><option value="preference">Préférence</option><option value="tradeoff">Compromis à expliquer</option></select></label>}
      {kind === 'reference' && <label className="wide">Question de référence<textarea required minLength={3} maxLength={2000} rows={3} value={fields.metadata.question ?? ''} onChange={(event) => meta('question', event.target.value)} placeholder="Quelle question souhaites-tu utiliser pour évaluer Kora ?" /></label>}
      {(kind === 'feedback' || kind === 'check') && <label>État déclaré<select value={fields.metadata.progress} onChange={(event) => meta('progress', event.target.value)}>{(kind === 'check' ? ['not_run', 'passed', 'failed'] : ['open', 'in_progress', 'resolved']).map((value) => <option key={value} value={value}>{progressLabels[value]}</option>)}</select></label>}
      {kind === 'source' && <label className="wide import-field">Importer un texte .txt / .md<input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={(event) => void importText(event.target.files?.[0])} /><small>100 Ko maximum. Pour un PDF, colle ici les passages utiles et leur référence.</small>{fileError && <span className="field-error" role="alert">{fileError}</span>}</label>}
      <label className="wide">{label.content}<textarea required minLength={5} maxLength={60000} rows={kind === 'source' || kind === 'prompt' ? 12 : 7} value={fields.content} onChange={(event) => setFields({ ...fields, content: event.target.value })} placeholder={kind === 'prompt' ? 'Précise le rôle, les questions à poser, le style et les preuves à exiger. Les sources restent du contexte non fiable.' : 'Saisis un contenu utile, ses hypothèses et ses limites.'} /><small>{fields.content.length.toLocaleString('fr-FR')} / 60 000 caractères · enregistrement explicite avec le bouton ci-dessous</small></label>
      {kind === 'source' && <p className="form-explanation wide">Une fiche enregistrée prépare le corpus de connaissances. Elle ne modifie pas les paramètres d’un modèle et ne devient pas automatiquement une source validée.</p>}
      {kind === 'prompt' && <p className="form-explanation wide">Ces consignes pourront guider le futur modèle. Elles sont testables dans une configuration figée ; aucune génération réelle n’est activée.</p>}
      {item?.history && item.history.length > 1 && <details className="wide revision-history"><summary>Historique des sauvegardes ({item.history.length})</summary><label>Révision à consulter<select value={pastRevision} onChange={(event) => setPastRevision(event.target.value)}><option value="">Choisir une révision</option>{item.history.map((entry) => <option key={entry.revision} value={entry.revision}>Révision {entry.revision} · {dateLabel(entry.created_at)}</option>)}</select></label>{historical && <pre>{historical.snapshot.content}</pre>}</details>}
      <div className="form-actions wide"><button className="primary-button" disabled={workspace.busy}>{workspace.busy ? 'Enregistrement…' : 'Enregistrer le brouillon'}</button><button type="button" className="outline-button" onClick={close}>Annuler</button></div>
    </form>
  </Modal>
}

export default function ContentManager({ kind, workspace, role, userId }: { kind: Kind; workspace: Workspace; role: Role; userId: string }) {
  const [query, setQuery] = useState('')
  const [provider, setProvider] = useState<Provider>('multi')
  const [showArchived, setShowArchived] = useState(false)
  const [editor, setEditor] = useState<Item | 'new' | null>(null)
  const [reading, setReading] = useState(false)
  const [matches, setMatches] = useState<SourceExcerpt[] | null>(null)
  const label = kindLabels[kind]
  const items = workspace.data.items.filter((item) => item.kind === kind && (showArchived || item.status !== 'archived') && (provider === 'multi' || item.provider === provider) && (!query || `${item.title} ${item.url} ${item.metadata.family ?? ''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())))
  async function open(id: string) {
    setReading(true); workspace.setError('')
    try { setEditor(await workspace.read<Item>(`/items/${id}`)) }
    catch (cause) { workspace.setError(cause instanceof Error ? cause.message : 'Lecture impossible.') }
    finally { setReading(false) }
  }
  async function search(event: FormEvent) {
    event.preventDefault(); setReading(true); workspace.setError('')
    try { setMatches(await workspace.read<SourceExcerpt[]>('/search', { method: 'POST', body: JSON.stringify({ query, provider }) })) }
    catch (cause) { workspace.setError(cause instanceof Error ? cause.message : 'Recherche impossible.') }
    finally { setReading(false) }
  }
  return <section className="workspace-section">
    <div className="workspace-section-heading"><div><h2>{label.plural}</h2><p>{label.help}</p></div><button className="primary-button" onClick={() => setEditor('new')}>＋ Ajouter {kind === 'prompt' ? 'des consignes' : kind === 'source' ? 'une fiche cloud' : kind === 'reference' ? 'un exemple' : kind === 'check' ? 'un contrôle' : kind === 'feedback' ? 'un retour' : 'un critère'}</button></div>
    {kind === 'source' && <div className="provider-stats">{(['aws', 'azure', 'gcp'] as Provider[]).map((id) => <button key={id} onClick={() => setProvider(provider === id ? 'multi' : id)} aria-pressed={provider === id}><span className={`provider-symbol provider-${id}`}>{id === 'aws' ? 'aws' : id === 'azure' ? 'Az' : 'G'}</span><span><strong>{providers[id]}</strong><small>{workspace.data.items.filter((item) => item.kind === 'source' && item.provider === id && item.status !== 'archived').length} fiche(s) enregistrée(s)</small></span></button>)}</div>}
    <form className="workspace-filters" onSubmit={kind === 'source' ? search : (event) => event.preventDefault()}><label className="search-field"><span className="sr-only">Rechercher une contribution</span><input value={query} onChange={(event) => { setQuery(event.target.value); setMatches(null) }} placeholder={kind === 'source' ? 'Un sujet, un service ou un mot-clé…' : 'Rechercher un titre…'} /></label>{['source', 'criterion', 'reference'].includes(kind) && <label><span className="sr-only">Filtrer par cloud</span><select value={provider} onChange={(event) => { setProvider(event.target.value as Provider); setMatches(null) }}>{Object.entries(providers).map(([id, name]) => <option key={id} value={id}>{id === 'multi' ? 'Tous les clouds' : name}</option>)}</select></label>}{kind === 'source' && <button className="outline-button" disabled={reading || query.trim().length < 2}>Chercher dans les contenus</button>}<label className="checkbox-label"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> Voir les archives</label></form>
    {matches !== null && <div className="search-results"><h3>Résultats de la recherche textuelle · {matches.length}</h3>{matches.length ? matches.map((match) => <article key={match.id}><button className="text-button" onClick={() => void open(match.id)}>{match.title}</button><p>{match.excerpt}</p><small>{providers[match.provider]} · révision {match.revision} · {match.status === 'reviewed' ? 'relu' : 'à relire'}</small></article>) : <p>Aucun passage trouvé. Essaie des mots-clés plus précis ou ajoute du contenu.</p>}</div>}
    {reading && <p className="muted" role="status">Lecture en cours…</p>}
    {items.length ? <div className="contribution-grid">{items.map((item) => <article className="contribution-card" key={item.id}><div className="contribution-meta"><span className={`provider-tag provider-${item.provider}`}>{providers[item.provider]}</span><State value={item.status} /></div><h3>{item.title}</h3><p>{kind === 'reference' ? item.metadata.question : kind === 'source' ? (item.metadata.family || (item.metadata.origin === 'official' ? 'Référence officielle déclarée' : 'Contribution à vérifier')) : kind === 'check' || kind === 'feedback' ? progressLabels[item.metadata.progress] : kind === 'criterion' ? (item.metadata.criterion_type === 'preference' ? 'Préférence' : item.metadata.criterion_type === 'tradeoff' ? 'Compromis' : 'Contrainte bloquante') : 'Consignes éditoriales versionnées'}</p>{item.url && <a className="contribution-url" href={item.url} target="_blank" rel="noreferrer">Consulter la référence</a>}<small>Révision {item.revision} · {dateLabel(item.updated_at)}</small><div className="contribution-actions"><button className="outline-button" onClick={() => void open(item.id)}>Lire / modifier</button>{item.status === 'draft' && role !== 'member' && <button className="text-button" disabled={workspace.busy || item.created_by === userId || item.modified_by === userId} title={item.created_by === userId || item.modified_by === userId ? 'Un autre compte autorisé doit relire cette contribution.' : 'Valider la relecture'} onClick={() => void workspace.act('Contribution relue.', `/items/${item.id}/review`, { expected_revision: item.revision })}>Marquer comme relu</button>}{role === 'publisher' && item.status !== 'archived' && <button className="text-button archive-action" disabled={workspace.busy} onClick={() => void workspace.act('Contribution archivée. Les configurations existantes sont conservées.', `/items/${item.id}/archive`, { expected_revision: item.revision })}>Archiver</button>}</div></article>)}</div> : <EmptyState title={`Aucun élément dans « ${label.plural} »`}>Ajoute une première contribution ou ajuste les filtres. Aucun contenu d’exemple n’est présenté comme une connaissance validée.</EmptyState>}
    {editor && <ItemEditor kind={kind} item={editor === 'new' ? null : editor} workspace={workspace} close={() => setEditor(null)} />}
    {workspace.error && editor && <p className="modal-error" role="alert">{workspace.error}</p>}
  </section>
}

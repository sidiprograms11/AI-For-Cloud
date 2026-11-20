import { useState, type FormEvent } from 'react'
import { EmptyState, Modal, State, dateLabel, type Workspace } from './shared'
import { providers, type Experiment, type Item, type Release } from './types'
import ExperimentView from './ExperimentView'

export function ReleaseBuilder({ workspace, close }: { workspace: Workspace; close: () => void }) {
  const [title, setTitle] = useState('')
  const [promptId, setPromptId] = useState('')
  const [sourceIds, setSourceIds] = useState<string[]>([])
  const sources = workspace.data.items.filter((item) => item.kind === 'source' && item.status !== 'archived')
  const prompts = workspace.data.items.filter((item) => item.kind === 'prompt' && item.status !== 'archived')
  async function submit(event: FormEvent) {
    event.preventDefault()
    const result = await workspace.act<Release>('Configuration candidate enregistrée. Les contenus sont figés à leur révision actuelle.', '/releases', { title, prompt_id: promptId, source_ids: sourceIds })
    if (result) close()
  }
  return <Modal title="Préparer une configuration candidate" close={close}><form className="workspace-form" onSubmit={submit}>{workspace.error && <p className="alert error wide" role="alert">{workspace.error}</p>}<p className="form-explanation wide">Cette configuration conserve une copie des consignes et fiches sélectionnées. Elle pourra être testée avant relecture et activation. Les modifications ultérieures des fiches ne la changent pas.</p><label className="wide">Nom de la configuration<input autoFocus required minLength={3} maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. corpus stockage — première itération" /></label><label className="wide">Consignes de réponse<select required value={promptId} onChange={(event) => setPromptId(event.target.value)}><option value="">Sélectionner des consignes enregistrées</option>{prompts.map((item) => <option key={item.id} value={item.id}>{item.title} · r{item.revision} · {item.status === 'reviewed' ? 'relu' : 'brouillon'}</option>)}</select></label><fieldset className="wide source-selection"><legend>Fiches cloud à utiliser · {sourceIds.length}/20</legend>{sources.length ? sources.map((source) => <label key={source.id}><input type="checkbox" checked={sourceIds.includes(source.id)} disabled={!sourceIds.includes(source.id) && sourceIds.length >= 20} onChange={(event) => setSourceIds(event.target.checked ? [...sourceIds, source.id] : sourceIds.filter((id) => id !== source.id))} /><span><strong>{source.title}</strong><small>{providers[source.provider]} · révision {source.revision} · {source.status === 'reviewed' ? 'relu' : 'à relire'}</small></span></label>) : <p>Ajoute des fiches dans Cloud & besoins avant de préparer une configuration.</p>}</fieldset>{prompts.length === 0 && <p className="form-explanation wide">Ajoute d’abord des consignes dans IA & consignes.</p>}<div className="form-actions wide"><button className="primary-button" disabled={workspace.busy || !promptId || sourceIds.length === 0}>Enregistrer la configuration candidate</button><button className="outline-button" type="button" onClick={close}>Annuler</button></div></form></Modal>
}

export default function Laboratory({ workspace }: { workspace: Workspace }) {
  const [building, setBuilding] = useState(false)
  const [releaseId, setReleaseId] = useState('')
  const [question, setQuestion] = useState('')
  const [expected, setExpected] = useState<Item | null>(null)
  const [result, setResult] = useState<Experiment | null>(null)
  const [reading, setReading] = useState(false)
  const references = workspace.data.items.filter((item) => item.kind === 'reference' && item.status !== 'archived')
  async function useReference(id: string) {
    setExpected(null)
    if (!id) return
    try { const item = await workspace.read<Item>(`/items/${id}`); setQuestion(item.metadata.question ?? ''); setExpected(item) }
    catch (cause) { workspace.setError(cause instanceof Error ? cause.message : 'Lecture impossible.') }
  }
  async function run(event: FormEvent) {
    event.preventDefault()
    const experiment = await workspace.act<Experiment>('Expérience enregistrée avec sa configuration et ses passages.', `/releases/${releaseId}/tests`, { question })
    if (experiment) setResult(experiment)
  }
  async function open(id: string) {
    setReading(true)
    try { setResult(await workspace.read<Experiment>(`/experiments/${id}`)) }
    catch (cause) { workspace.setError(cause instanceof Error ? cause.message : 'Lecture impossible.') }
    finally { setReading(false) }
  }
  return <section className="workspace-section"><div className="workspace-section-heading"><div><h2>Laboratoire de préparation des réponses</h2><p>Sélectionne des consignes et des connaissances, retrouve les passages utiles et conserve le résultat du test.</p></div><button className="primary-button" onClick={() => setBuilding(true)}>＋ Configuration candidate</button></div><div className="lab-disclosure"><strong>Mode actuel : recherche réelle, réponse IA simulée.</strong><p>Le corpus, les consignes et les exemples sont enregistrés. Aucun modèle ni embeddings ne sont choisis ; cette expérience ne réalise pas d’entraînement ou de génération.</p></div>{workspace.data.releases.length ? <div className="laboratory-grid"><form className="lab-form" onSubmit={run}><label>Configuration figée<select required value={releaseId} onChange={(event) => { setReleaseId(event.target.value); setResult(null) }}><option value="">Choisir une configuration candidate ou active</option>{workspace.data.releases.map((release) => <option key={release.id} value={release.id}>v{release.version} · {release.title} · {release.status}</option>)}</select></label>{references.length > 0 && <label>Partir d’une question de référence<select defaultValue="" onChange={(event) => void useReference(event.target.value)}><option value="">Saisir ma propre question</option>{references.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}<label>Question de test<textarea required minLength={3} maxLength={2000} rows={6} value={question} onChange={(event) => { setQuestion(event.target.value); setExpected(null) }} placeholder="Utilise les mots-clés que les fiches cloud doivent permettre de retrouver." /></label><button className="primary-button" disabled={workspace.busy || !releaseId}>{workspace.busy ? 'Recherche et enregistrement…' : 'Lancer une expérience simulée'}</button>{expected && <details className="reference-answer"><summary>Réponse de référence attendue</summary><pre>{expected.content}</pre></details>}<p className="muted">Le test enregistre les révisions utilisées. Il ne modifie aucune version active.</p></form><div className="lab-result">{result ? <ExperimentView experiment={result} /> : <EmptyState title="Le résultat de ton expérience apparaîtra ici">Les sources retrouvées, les consignes et les limites seront conservées avec la version de configuration.</EmptyState>}</div></div> : <EmptyState title="Prépare une première configuration">Ajoute au moins une fiche cloud et des consignes, puis utilise « Configuration candidate ».</EmptyState>}{workspace.data.experiments.length > 0 && <div className="recent-runs"><h3>Expériences récentes</h3>{workspace.data.experiments.slice(0, 8).map((experiment) => <button key={experiment.id} disabled={reading} onClick={() => void open(experiment.id)}><span>{experiment.question}</span><small>{dateLabel(experiment.created_at)} · {experiment.source_count} passage(s)</small></button>)}</div>}{building && <ReleaseBuilder workspace={workspace} close={() => setBuilding(false)} />}</section>
}

export function ReleaseSummary({ release }: { release: Release }) {
  return <div className="release-summary"><span className="release-number">v{release.version}</span><div><h3>{release.title}</h3><p>{release.source_count ?? release.snapshot?.sources.length} source(s) · {release.prompt_title ?? release.snapshot?.prompt.title}</p></div><State value={release.status} /></div>
}

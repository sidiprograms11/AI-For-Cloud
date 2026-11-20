import { useState, type FormEvent } from 'react'
import { EmptyState, dateLabel, type Workspace } from './shared'
import type { Experiment } from './types'
import ExperimentView from './ExperimentView'

export function ExperimentBrowser({ workspace, restitution = false }: { workspace: Workspace; restitution?: boolean }) {
  const [selected, setSelected] = useState<Experiment | null>(null)
  const [reading, setReading] = useState(false)
  async function open(id: string) {
    if (!id) { setSelected(null); return }
    setReading(true); workspace.setError('')
    try { setSelected(await workspace.read<Experiment>(`/experiments/${id}`)) }
    catch (cause) { workspace.setError(cause instanceof Error ? cause.message : 'Résultat indisponible.') }
    finally { setReading(false) }
  }
  return <section className="workspace-section"><div className="workspace-section-heading"><div><h2>{restitution ? 'Prévisualisation & export des résultats' : 'Exécutions du laboratoire'}</h2><p>{restitution ? 'Examine la question, les consignes et les passages exactement tels qu’ils ont été enregistrés.' : 'Retrouve chaque expérience, son statut et sa version de configuration.'}</p></div><span className="simulation-badge">{workspace.data.experiments.length} expérience(s) enregistrée(s)</span></div>{workspace.data.experiments.length ? <><label className="experiment-selector">Expérience à consulter<select defaultValue="" onChange={(event) => void open(event.target.value)}><option value="">Sélectionner une expérience</option>{workspace.data.experiments.map((experiment) => <option key={experiment.id} value={experiment.id}>{dateLabel(experiment.created_at)} · {experiment.question}</option>)}</select></label>{reading ? <p role="status">Lecture du résultat…</p> : selected ? <ExperimentView experiment={selected} /> : <EmptyState title="Choisis un résultat enregistré">La même restitution est utilisée ici et dans le laboratoire pour conserver les sources et les limites.</EmptyState>}</> : <EmptyState title="Aucun résultat à prévisualiser">Crée des connaissances et des consignes, prépare une configuration, puis lance une expérience dans le laboratoire.</EmptyState>}</section>
}

export default function Evaluations({ workspace }: { workspace: Workspace }) {
  const [experimentId, setExperimentId] = useState('')
  const [usefulness, setUsefulness] = useState('')
  const [grounding, setGrounding] = useState('')
  const [notes, setNotes] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault()
    const result = await workspace.act('Évaluation humaine enregistrée.', `/experiments/${experimentId}/evaluations`, { usefulness: Number(usefulness), grounding: Number(grounding), notes })
    if (result) { setNotes(''); setUsefulness(''); setGrounding('') }
  }
  const evaluations = workspace.data.evaluations.filter((evaluation) => !experimentId || evaluation.experiment_id === experimentId)
  return <section className="workspace-section"><div className="workspace-section-heading"><div><h2>Évaluations humaines</h2><p>Apprécie la pertinence des passages et la préparation du contexte. Ces notes ne mesurent pas une réponse LLM réelle.</p></div><span className="simulation-badge">{workspace.data.evaluations.length} évaluation(s)</span></div>{workspace.data.experiments.length ? <form className="workspace-form evaluation-form" onSubmit={submit}><label className="wide">Expérience évaluée<select required value={experimentId} onChange={(event) => setExperimentId(event.target.value)}><option value="">Sélectionner une expérience</option>{workspace.data.experiments.map((experiment) => <option value={experiment.id} key={experiment.id}>{experiment.question}</option>)}</select></label><label>Utilité du contexte (1 à 5)<select required value={usefulness} onChange={(event) => setUsefulness(event.target.value)}><option value="">Choisir une note</option>{[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}</select></label><label>Pertinence des sources (1 à 5)<select required value={grounding} onChange={(event) => setGrounding(event.target.value)}><option value="">Choisir une note</option>{[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}</select></label><label className="wide">Observations, erreurs et améliorations<textarea required minLength={5} maxLength={4000} rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Explique la note avec des faits vérifiables et les références examinées." /></label><div className="form-actions wide"><button className="primary-button" disabled={workspace.busy}>Enregistrer l’évaluation</button></div></form> : <EmptyState title="Une expérience est nécessaire">Lance un test dans le laboratoire avant de l’évaluer.</EmptyState>}<div className="evaluation-list">{evaluations.map((evaluation) => <article key={evaluation.id}><header><span>Utilité <strong>{evaluation.usefulness}/5</strong></span><span>Sources <strong>{evaluation.grounding}/5</strong></span><small>{dateLabel(evaluation.created_at)}</small></header><p>{evaluation.notes}</p><small>Évaluation humaine de l’expérience {evaluation.experiment_id.slice(0, 8)}</small></article>)}</div></section>
}

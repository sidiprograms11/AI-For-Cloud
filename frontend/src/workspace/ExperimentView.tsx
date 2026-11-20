import { dateLabel } from './shared'
import { providers, type Experiment } from './types'

export function exportExperiment(experiment: Experiment) {
  const result = experiment.result
  if (!result) return
  const text = [
    '# Kora — expérience de préparation du contexte', '', '**SIMULATION : aucune réponse générée par un modèle.**', '',
    `Date : ${dateLabel(experiment.created_at)}`, `Configuration : v${result.release_version}`, '',
    '## Question', '', experiment.question, '', '## Consignes figées', '', result.instructions.content ?? '', '',
    '## Passages retrouvés', '', ...result.sources.flatMap((source) => [
      `### ${source.title}`, `Cloud : ${providers[source.provider]} · révision ${source.revision} · statut ${source.status}`,
      `Référence : ${source.url || 'Contribution de l’équipe, sans URL externe'}`, '', source.excerpt, '',
    ]), '## Hypothèses et limites', '', ...result.hypotheses.map((value) => `- ${value}`), '',
    'Tokens et coût : non mesurés ; aucun appel LLM dans cette simulation.',
  ].join('\n')
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = `kora-experience-${experiment.id}.md`; link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function ExperimentView({ experiment }: { experiment: Experiment }) {
  const result = experiment.result
  if (!result) return <p className="muted">Sélectionne une expérience pour consulter son résultat enregistré.</p>
  return <div className="experiment-view"><div className="experiment-heading"><div><span className="eyebrow">Résultat enregistré · {dateLabel(experiment.created_at)}</span><h3>{experiment.question}</h3></div><span className="simulation-badge">Simulation explicite</span></div><p className="simulation-notice">{result.message}</p><div className="experiment-facts"><span>Configuration <strong>v{result.release_version}</strong></span><span>Passages retrouvés <strong>{result.sources.length}</strong></span><span>Recherche <strong>textuelle</strong></span><span>Durée observée <strong>{result.duration_ms} ms</strong></span></div><details className="instruction-preview"><summary>Consignes utilisées · {result.instructions.title} · r{result.instructions.revision}</summary><pre>{result.instructions.content}</pre></details><h4>Sources de ce résultat</h4>{result.sources.length ? result.sources.map((source) => <article className="retrieved-source" key={source.id}><div><span className={`provider-tag provider-${source.provider}`}>{providers[source.provider]}</span><span>Révision {source.revision} · {source.status === 'reviewed' ? 'relu au moment de la sélection' : 'contenu à relire'}</span></div><h4>{source.title}</h4><p>{source.excerpt}</p>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">Ouvrir la référence</a> : <small>Contribution de l’équipe, sans URL externe.</small>}</article>) : <div className="no-matches">Aucun passage correspondant dans cette configuration. Ce résultat ne permet pas de justifier une réponse cloud.</div>}<details className="experiment-limits"><summary>Hypothèses et limites</summary><ul>{result.hypotheses.map((value) => <li key={value}>{value}</li>)}</ul><p>Tokens, coût et qualité d’une réponse IA : non mesurés. Les notes ajoutées dans Qualité sont des évaluations humaines.</p></details><button className="outline-button" onClick={() => exportExperiment(experiment)}>Exporter ce résultat en Markdown</button></div>
}

import { useEffect, useState, type FormEvent } from 'react'
import { internalRequest } from './lib/api'

export type Role = 'member' | 'reviewer' | 'publisher'
type CaseState = 'draft' | 'tested' | 'in_review' | 'reviewed' | 'active' | 'superseded'
type CaseFields = {
  title: string
  company_context: string
  blocking_constraints: string[]
  preferences: string[]
  data_region: string
  budget_context: string
}
type CaseVersion = {
  id: string
  case_id: string
  version_no: number
  revision: number
  state: CaseState
  title: string
  company_context: string
  constraints: { blocking?: string[]; preferences?: string[]; data_region?: string; budget_context?: string }
  created_by: string
  created_at: string
}
type CaseTest = {
  id: string
  case_version_id: string
  version_revision: number
  status: 'simulated'
  result: { mode: string; message: string; missing_information: string[]; hypotheses: string[] }
  configuration: Record<string, string | number>
  created_at: string
}
type InternalCase = {
  id: string
  active_version_id: string | null
  versions: CaseVersion[]
  tests?: CaseTest[]
  events?: { id: string; action: string; created_at: string }[]
}

const labels: Record<CaseState, string> = {
  draft: 'Brouillon', tested: 'Testé', in_review: 'En relecture', reviewed: 'Relu', active: 'Version active', superseded: 'Version précédente',
}
const emptyFields: CaseFields = { title: '', company_context: '', blocking_constraints: [], preferences: [], data_region: '', budget_context: '' }

function StatePill({ state }: { state: CaseState }) { return <span className={`state-pill state-${state}`}>{labels[state]}</span> }

function CaseEditor({ initial, onSave, busy, cancel }: { initial?: CaseVersion; onSave: (fields: CaseFields, revision?: number) => void; busy: boolean; cancel: () => void }) {
  const [fields, setFields] = useState<CaseFields>(initial ? {
    title: initial.title, company_context: initial.company_context,
    blocking_constraints: initial.constraints.blocking ?? [], preferences: initial.constraints.preferences ?? [],
    data_region: initial.constraints.data_region ?? '', budget_context: initial.constraints.budget_context ?? '',
  } : emptyFields)
  const [blockingText, setBlockingText] = useState(fields.blocking_constraints.join('\n'))
  const [preferencesText, setPreferencesText] = useState(fields.preferences.join('\n'))
  function submit(event: FormEvent) {
    event.preventDefault()
    onSave({ ...fields, blocking_constraints: blockingText.split('\n').map((item) => item.trim()).filter(Boolean), preferences: preferencesText.split('\n').map((item) => item.trim()).filter(Boolean) }, initial?.revision)
  }
  return <form className="case-editor" onSubmit={submit}><div className="editor-head"><div><span className="eyebrow">{initial ? `Version ${initial.version_no} · révision ${initial.revision}` : 'Nouveau cas'}</span><h3>{initial ? 'Modifier le brouillon' : 'Décrire un cas d’entreprise'}</h3></div><button type="button" className="text-button" onClick={cancel}>Fermer</button></div>
    <div className="editor-grid"><label className="wide">Titre du cas<input required minLength={3} maxLength={160} value={fields.title} onChange={(event) => setFields({ ...fields, title: event.target.value })} placeholder="Ex. Plateforme métier à moderniser" /></label><label className="wide">Contexte de l’entreprise<textarea required minLength={10} maxLength={4000} rows={4} value={fields.company_context} onChange={(event) => setFields({ ...fields, company_context: event.target.value })} placeholder="Activité, utilisateurs, applications et objectif…" /></label><label>Contraintes bloquantes <small>Une par ligne</small><textarea rows={4} value={blockingText} onChange={(event) => setBlockingText(event.target.value)} placeholder="Ex. données en Europe" /></label><label>Préférences <small>Une par ligne</small><textarea rows={4} value={preferencesText} onChange={(event) => setPreferencesText(event.target.value)} placeholder="Ex. équipe habituée à Kubernetes" /></label><label>Région des données<input value={fields.data_region} maxLength={120} onChange={(event) => setFields({ ...fields, data_region: event.target.value })} placeholder="À préciser" /></label><label>Contexte budgétaire<input value={fields.budget_context} maxLength={240} onChange={(event) => setFields({ ...fields, budget_context: event.target.value })} placeholder="À préciser" /></label></div><div className="editor-actions"><button className="primary-button" disabled={busy}>{busy ? 'Enregistrement…' : initial ? 'Enregistrer le brouillon' : 'Créer le cas'}</button><span>Enregistrement dans l’espace de travail de l’équipe.</span></div></form>
}

export default function ConsoleCases({ token, role }: { token: string; role: Role }) {
  const [cases, setCases] = useState<InternalCase[]>([])
  const [selected, setSelected] = useState<InternalCase | null>(null)
  const [editor, setEditor] = useState<'new' | 'edit' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)

  async function refresh(caseId?: string) {
    const list = await internalRequest<InternalCase[]>('/internal/cases', token)
    setCases(list)
    const target = caseId ?? selected?.id
    if (target) setSelected(await internalRequest<InternalCase>(`/internal/cases/${target}`, token))
    setLoading(false)
  }
  useEffect(() => { void internalRequest<InternalCase[]>('/internal/cases', token).then(setCases).catch((cause) => setError(cause instanceof Error ? cause.message : 'Chargement impossible.')).finally(() => setLoading(false)) }, [token])

  async function act(label: string, callback: () => Promise<string | undefined>) {
    setBusy(true); setError(''); setNotice('')
    try { const caseId = await callback(); await refresh(caseId); setEditor(null); setNotice(label) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Opération impossible.') }
    finally { setBusy(false) }
  }
  const openVersion = selected?.versions.find((version) => ['draft', 'tested', 'in_review', 'reviewed'].includes(version.state))
  const activeVersion = selected?.versions.find((version) => version.id === selected.active_version_id)
  const shownVersion = openVersion ?? activeVersion ?? selected?.versions[0]
  const latestTest = selected?.tests?.find((test) => test.case_version_id === shownVersion?.id)
  const upToDateTest = latestTest?.version_revision === shownVersion?.revision

  async function save(fields: CaseFields, revision?: number) {
    if (editor === 'new') {
      await act('Cas créé et enregistré.', async () => {
        const created = await internalRequest<InternalCase>('/internal/cases', token, { method: 'POST', body: JSON.stringify(fields) })
        return created.id
      })
    } else if (shownVersion && selected && revision) {
      await act('Brouillon enregistré. Un nouveau test est nécessaire.', async () => {
        await internalRequest(`/internal/cases/${selected.id}/versions/${shownVersion.id}`, token, { method: 'PATCH', body: JSON.stringify({ ...fields, expected_revision: revision }) })
        return selected.id
      })
    }
  }
  async function versionAction(path: string, label: string) {
    if (!selected) return
    await act(label, async () => { await internalRequest(`/internal/cases/${selected.id}${path}`, token, { method: 'POST' }); return selected.id })
  }

  return <div className="workspace-grid"><section className="case-list panel"><div className="panel-heading"><div><span className="eyebrow">Brique 01</span><h2>Cas d’entreprise</h2></div><button className="small-primary" onClick={() => { setSelected(null); setEditor('new'); setError(''); setNotice('') }}>＋ Nouveau</button></div><p className="panel-description">Des besoins structurés pour préparer les futurs tests de comparaison.</p>{loading ? <p className="muted">Chargement…</p> : cases.length === 0 ? <div className="blank-state">Aucun cas enregistré. Crée un premier scénario.</div> : <div className="case-items">{cases.map((item) => { const latest = item.versions[0]; return <button className={`case-item ${selected?.id === item.id ? 'selected' : ''}`} key={item.id} onClick={() => { setEditor(null); void internalRequest<InternalCase>(`/internal/cases/${item.id}`, token).then(setSelected).catch((cause) => setError(cause instanceof Error ? cause.message : 'Chargement impossible.')) }}><span>{latest?.title ?? 'Cas sans titre'}</span><small>Version {latest?.version_no ?? '—'} · {latest ? labels[latest.state] : '—'}</small></button> })}</div>}</section>
    <section className="case-detail panel">{error && <p className="alert error" role="alert">{error}</p>}{notice && <p className="alert success" role="status">{notice}</p>}{editor ? <CaseEditor key={`${editor}-${shownVersion?.id ?? 'new'}-${shownVersion?.revision ?? 0}`} initial={editor === 'edit' ? shownVersion : undefined} onSave={save} busy={busy} cancel={() => setEditor(null)} /> : selected && shownVersion ? <>
      <div className="detail-top"><div><span className="eyebrow">Scénario interne · version {shownVersion.version_no}</span><h2>{shownVersion.title}</h2></div><StatePill state={shownVersion.state} /></div>
      {activeVersion && activeVersion.id !== shownVersion.id && <div className="active-banner">La version active est la v{activeVersion.version_no}. Ce brouillon ne la modifie pas.</div>}
      <p className="context-copy">{shownVersion.company_context}</p><div className="facts-grid"><div><strong>Contraintes bloquantes</strong>{shownVersion.constraints.blocking?.length ? <ul>{shownVersion.constraints.blocking.map((value) => <li key={value}>{value}</li>)}</ul> : <p>Non renseignées</p>}</div><div><strong>Préférences</strong>{shownVersion.constraints.preferences?.length ? <ul>{shownVersion.constraints.preferences.map((value) => <li key={value}>{value}</li>)}</ul> : <p>Non renseignées</p>}</div><div><strong>Région des données</strong><p>{shownVersion.constraints.data_region || 'À préciser'}</p></div><div><strong>Budget</strong><p>{shownVersion.constraints.budget_context || 'À préciser'}</p></div></div>
      <div className="workflow"><span>Brouillon</span><span>Test</span><span>Relecture</span><span>Publication</span><span>Active</span></div>
      <div className="case-actions">{['draft', 'tested'].includes(shownVersion.state) && <><button className="outline-button" onClick={() => setEditor('edit')} disabled={busy}>Modifier</button><button className="primary-button" disabled={busy} onClick={() => void versionAction(`/versions/${shownVersion.id}/tests`, 'Test simulé enregistré.')}>Lancer un test simulé</button></>}{shownVersion.state === 'tested' && upToDateTest && <button className="outline-button" disabled={busy} onClick={() => void versionAction(`/versions/${shownVersion.id}/submit-review`, 'Version soumise à relecture.')}>Soumettre à relecture</button>}{shownVersion.state === 'in_review' && role !== 'member' && <button className="outline-button" disabled={busy} onClick={() => void versionAction(`/versions/${shownVersion.id}/approve`, 'Relecture validée.')}>Valider la relecture</button>}{shownVersion.state === 'reviewed' && role === 'publisher' && <button className="primary-button" disabled={busy} onClick={() => void versionAction(`/versions/${shownVersion.id}/publish`, 'Version publiée.')}>Publier cette version</button>}{!openVersion && activeVersion && <button className="outline-button" disabled={busy} onClick={() => void versionAction('/drafts', 'Nouveau brouillon créé depuis la version active.')}>Créer un nouveau brouillon</button>}</div>
      {selected.versions.length > 1 && <div className="version-list"><h3>Versions</h3>{selected.versions.map((version) => <div key={version.id}><span>v{version.version_no} · révision {version.revision}</span><StatePill state={version.state} />{version.state === 'superseded' && role === 'publisher' && <button className="text-button" disabled={busy} onClick={() => void versionAction(`/versions/${version.id}/rollback`, 'Version précédente réactivée.')}>Réactiver</button>}</div>)}</div>}
      <div className="test-panel"><div className="section-title"><h3>Dernier test</h3><span>{latestTest ? 'Simulation explicite' : 'Aucun test'}</span></div>{latestTest ? <><p className="simulation-marker">{latestTest.result.message}</p>{!upToDateTest && <p className="alert warning">Ce résultat concerne une ancienne révision du brouillon. Relance un test.</p>}<div className="test-columns"><div><strong>Informations manquantes</strong>{latestTest.result.missing_information.length ? <ul>{latestTest.result.missing_information.map((value) => <li key={value}>{value}</li>)}</ul> : <p>Aucune dans cette grille minimale.</p>}</div><div><strong>Hypothèses du test</strong><ul>{latestTest.result.hypotheses.map((value) => <li key={value}>{value}</li>)}</ul></div></div><p className="config-line">Configuration : adaptateur {latestTest.configuration.llm_adapter} · règles {latestTest.configuration.comparison_rules} · révision {latestTest.version_revision}</p></> : <p className="muted">Aucune recommandation réelle n’a été calculée.</p>}</div>
      {selected.events && <details className="events"><summary>Historique des actions ({selected.events.length})</summary>{selected.events.map((event) => <p key={event.id}>{new Date(event.created_at).toLocaleString('fr-FR')} · {event.action}</p>)}</details>}
    </> : <div className="detail-empty"><div className="detail-empty-icon">✦</div><h2>Choisis ou crée un cas</h2><p>Définis son contexte et ses contraintes, puis exécute un test explicitement simulé.</p></div>}</section>
  </div>
}

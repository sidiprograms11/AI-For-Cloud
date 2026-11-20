import { useState } from 'react'
import ConsoleCases, { type Role } from '../ConsoleCases'
import ContentManager from './ContentManager'
import Laboratory from './Laboratory'
import Versions, { Activity } from './Versions'
import Evaluations, { ExperimentBrowser } from './Reviews'
import { Tabs, useWorkspace } from './shared'
import type { Space } from './types'
import './workspace.css'

const navigation: Record<Space, { id: string; label: string }[]> = {
  cases: [{ id: 'sources', label: 'Bibliothèque CLOUD' }, { id: 'criteria', label: 'Critères & contraintes' }, { id: 'cases', label: 'Cas d’entreprise' }],
  knowledge: [{ id: 'prompts', label: 'Consignes de réponse' }, { id: 'references', label: 'Questions & réponses attendues' }, { id: 'lab', label: 'Laboratoire' }],
  backend: [{ id: 'versions', label: 'Configurations' }, { id: 'runs', label: 'Exécutions' }, { id: 'activity', label: 'Journal d’activité' }],
  experience: [{ id: 'preview', label: 'Prévisualisation & export' }, { id: 'feedback', label: 'Retours d’interface' }],
  quality: [{ id: 'evaluations', label: 'Évaluations humaines' }, { id: 'checks', label: 'Contrôles & preuves' }, { id: 'delivery', label: 'Validation & livraison' }],
}

export default function TeamWorkspace({ token, role, userId, space }: { token: string; role: Role; userId: string; space: Space }) {
  const workspace = useWorkspace(token)
  const [tabs, setTabs] = useState<Record<Space, string>>({ cases: 'sources', knowledge: 'prompts', backend: 'versions', experience: 'preview', quality: 'evaluations' })
  const tab = tabs[space]
  const contentProps = { workspace, role, userId }
  return <div className="team-workspace"><div className="workspace-overview"><div><strong>{workspace.data.items.filter((item) => item.kind === 'source' && item.status !== 'archived').length}</strong><span>fiches cloud</span></div><div><strong>{workspace.data.items.filter((item) => item.kind === 'prompt' && item.status !== 'archived').length}</strong><span>consignes enregistrées</span></div><div><strong>{workspace.data.releases.length}</strong><span>configurations récentes</span></div><div><strong>{workspace.data.experiments.length}</strong><span>expériences récentes</span></div><button className="text-button" disabled={workspace.loading || workspace.busy} onClick={() => void workspace.refresh().catch((cause) => workspace.setError(cause instanceof Error ? cause.message : 'Actualisation impossible.'))}>Actualiser</button></div><Tabs items={navigation[space]} value={tab} onChange={(value) => setTabs({ ...tabs, [space]: value })} />{workspace.error && <p className="alert error" role="alert">{workspace.error}</p>}{workspace.notice && <p className="alert success" role="status">{workspace.notice}</p>}{workspace.loading ? <div className="workspace-loading" role="status">Chargement de l’espace de l’équipe…</div> : <>
    {tab === 'sources' && <ContentManager key="sources" kind="source" {...contentProps} />}
    {tab === 'criteria' && <ContentManager key="criteria" kind="criterion" {...contentProps} />}
    {tab === 'cases' && <ConsoleCases token={token} role={role} />}
    {tab === 'prompts' && <ContentManager key="prompts" kind="prompt" {...contentProps} />}
    {tab === 'references' && <ContentManager key="references" kind="reference" {...contentProps} />}
    {tab === 'lab' && <Laboratory workspace={workspace} />}
    {tab === 'versions' && <Versions {...contentProps} />}
    {tab === 'runs' && <ExperimentBrowser workspace={workspace} />}
    {tab === 'activity' && <Activity workspace={workspace} />}
    {tab === 'preview' && <ExperimentBrowser workspace={workspace} restitution />}
    {tab === 'feedback' && <ContentManager key="feedback" kind="feedback" {...contentProps} />}
    {tab === 'evaluations' && <Evaluations workspace={workspace} />}
    {tab === 'checks' && <ContentManager key="checks" kind="check" {...contentProps} />}
    {tab === 'delivery' && <Versions {...contentProps} delivery />}
  </>}</div>
}

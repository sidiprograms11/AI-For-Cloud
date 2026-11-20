export type Space = 'cases' | 'knowledge' | 'backend' | 'experience' | 'quality'
export type Kind = 'source' | 'criterion' | 'prompt' | 'reference' | 'feedback' | 'check'
export type Provider = 'aws' | 'azure' | 'gcp' | 'multi'
export type Item = {
  id: string; kind: Kind; provider: Provider; title: string; content?: string; url: string
  metadata: Record<string, string>; revision: number; status: 'draft' | 'reviewed' | 'archived'
  created_by: string; modified_by: string; reviewed_by: string | null; updated_at: string
  history?: { revision: number; snapshot: Item; created_at: string }[]
}
export type ItemFields = Pick<Item, 'kind' | 'provider' | 'title' | 'url' | 'metadata'> & { content: string }
export type Release = {
  id: string; version: number; title: string; status: 'draft' | 'tested' | 'reviewed' | 'active' | 'superseded'
  created_by: string; created_at: string; source_count?: number; prompt_title?: string
  snapshot?: { prompt: Item; sources: Item[]; mode: 'simulation'; retrieval: 'lexical' }
}
export type SourceExcerpt = Pick<Item, 'id' | 'title' | 'provider' | 'url' | 'revision' | 'status'> & { excerpt: string }
export type Experiment = {
  id: string; release_id: string; question: string; status: 'simulated'; created_at: string; source_count?: number
  result?: {
    mode: 'simulation'; message: string; sources: SourceExcerpt[]; instructions: Item
    release_version: number; hypotheses: string[]; duration_ms: number
  }
}
export type Evaluation = {
  id: string; experiment_id: string; usefulness: number; grounding: number; notes: string; created_at: string
}
export type WorkspaceData = {
  items: Item[]; releases: Release[]; experiments: Experiment[]; evaluations: Evaluation[]
  events: { id: string; resource_id: string; action: string; actor_id: string; created_at: string }[]
  active_release_id: string | null
}
export const providers: Record<Provider, string> = { aws: 'AWS', azure: 'Microsoft Azure', gcp: 'Google Cloud', multi: 'Transverse' }
export const kindLabels: Record<Kind, { singular: string; plural: string; help: string; content: string }> = {
  source: { singular: 'Fiche cloud', plural: 'Bibliothèque CLOUD', help: 'Enregistre des connaissances, leur provenance et leurs limites pour préparer le contexte de Kora.', content: 'Contenu cloud' },
  criterion: { singular: 'Critère', plural: 'Critères de comparaison', help: 'Formalise les contraintes bloquantes, préférences et compromis qui guideront la comparaison.', content: 'Règle, justification et limites' },
  prompt: { singular: 'Consignes', plural: 'Consignes de réponse', help: 'Décris le comportement attendu : ton, structure, questions de clarification et exigences de sources.', content: 'Consignes à donner à Kora' },
  reference: { singular: 'Exemple de référence', plural: 'Questions & réponses attendues', help: 'Prépare des exemples autorisés pour comparer les futures réponses à vos attentes.', content: 'Réponse attendue et critères de réussite' },
  feedback: { singular: 'Retour d’interface', plural: 'Retours & problèmes d’interface', help: 'Documente ce qui gêne la compréhension, les sources ou la présentation des résultats.', content: 'Problème observé, résultat attendu et reproduction' },
  check: { singular: 'Contrôle', plural: 'Contrôles & preuves', help: 'Conserve les procédures et les preuves des vérifications réalisées par l’équipe.', content: 'Procédure, observations et preuve du résultat' },
}
export const stateLabels: Record<string, string> = { draft: 'Brouillon', reviewed: 'Relu', archived: 'Archivé', tested: 'Testé en simulation', active: 'Active', superseded: 'Version précédente' }
export const progressLabels: Record<string, string> = { open: 'À traiter', in_progress: 'En cours', resolved: 'Résolu', not_run: 'Non exécuté', passed: 'Réussi (déclaré)', failed: 'Échoué (déclaré)' }

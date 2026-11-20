import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { internalRequest } from '../lib/api'
import type { WorkspaceData } from './types'
import { stateLabels } from './types'

export const workspacePath = '/internal/workspace'
const empty: WorkspaceData = { items: [], releases: [], experiments: [], evaluations: [], events: [], active_release_id: null }

export function useWorkspace(token: string) {
  const [data, setData] = useState<WorkspaceData>(empty)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const read = useCallback(<T,>(path = '', init: RequestInit = {}) => internalRequest<T>(workspacePath + path, token, init), [token])
  const refresh = useCallback(async () => { setData(await read<WorkspaceData>()); }, [read])
  useEffect(() => {
    let current = true
    setLoading(true); setError('')
    void read<WorkspaceData>().then((next) => { if (current) setData(next) }).catch((cause) => { if (current) setError(cause instanceof Error ? cause.message : 'Chargement impossible.') }).finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [read])
  const act = async <T,>(label: string, path: string, payload: unknown = {}, method = 'POST'): Promise<T | undefined> => {
    setBusy(true); setError(''); setNotice('')
    try {
      const value = await read<T>(path, { method, body: JSON.stringify(payload) })
      await refresh(); setNotice(label); return value
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Opération impossible.'); return undefined }
    finally { setBusy(false) }
  }
  return { data, loading, busy, error, notice, read, act, refresh, setError }
}
export type Workspace = ReturnType<typeof useWorkspace>

export function Modal({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const titleId = useId()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { ref.current?.showModal(); return () => ref.current?.close() }, [])
  return <dialog className="workspace-modal" aria-labelledby={titleId} ref={ref} onCancel={(event) => { event.preventDefault(); close() }} onClick={(event) => { if (event.target === event.currentTarget) close() }}><div className="modal-content"><header><h2 id={titleId}>{title}</h2><button className="modal-close" type="button" aria-label="Fermer" onClick={close}>×</button></header>{children}</div></dialog>
}
export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className="workspace-empty"><span aria-hidden="true">＋</span><h3>{title}</h3><p>{children}</p></div>
}
export function State({ value }: { value: string }) { return <span className={`state-pill state-${value}`}>{stateLabels[value] ?? value}</span> }
export function Tabs({ items, value, onChange }: { items: { id: string; label: string }[]; value: string; onChange: (id: string) => void }) {
  return <nav className="workspace-tabs" aria-label="Outils de la rubrique">{items.map((item) => <button key={item.id} aria-current={item.id === value ? 'page' : undefined} className={item.id === value ? 'selected' : ''} onClick={() => onChange(item.id)}>{item.label}</button>)}</nav>
}
export const dateLabel = (date: string) => new Date(date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })

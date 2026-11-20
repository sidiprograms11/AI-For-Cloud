const uuid = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'

export function resolveWorkspaceRoute(method: string, path: string) {
  if (method === 'GET' && path === '/internal/workspace') return { action: 'overview' }
  if (method === 'POST' && path === '/internal/workspace/search') return { action: 'search_sources' }
  if (method === 'POST' && path === '/internal/workspace/items') return { action: 'save_item' }
  if (method === 'POST' && path === '/internal/workspace/releases') return { action: 'prepare_release' }
  const item = path.match(new RegExp(`^/internal/workspace/items/(${uuid})(?:/(review|archive))?$`))
  if (item) {
    if (!item[2] && method === 'GET') return { action: 'get_item', resourceId: item[1] }
    if (!item[2] && method === 'PATCH') return { action: 'save_item', resourceId: item[1] }
    if (item[2] && method === 'POST') return { action: `${item[2]}_item`, resourceId: item[1] }
  }
  const release = path.match(new RegExp(`^/internal/workspace/releases/(${uuid})(?:/(tests|approve|activate|rollback))?$`))
  if (release) {
    if (!release[2] && method === 'GET') return { action: 'get_release', resourceId: release[1] }
    if (release[2] && method === 'POST') return { action: release[2] === 'tests' ? 'run_experiment' : `${release[2]}_release`, resourceId: release[1] }
  }
  const experiment = path.match(new RegExp(`^/internal/workspace/experiments/(${uuid})(/evaluations)?$`))
  if (experiment) {
    if (!experiment[2] && method === 'GET') return { action: 'get_experiment', resourceId: experiment[1] }
    if (experiment[2] && method === 'POST') return { action: 'evaluate', resourceId: experiment[1] }
  }
  return null
}

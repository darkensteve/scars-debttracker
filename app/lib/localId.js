export function createLocalId(prefix = 'local') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function isLocalId(id) {
  return typeof id === 'string' && id.startsWith('local-');
}

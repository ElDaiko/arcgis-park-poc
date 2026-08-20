export const BASEMAP_OPTIONS = [
  { id: 'topo-vector', label: 'Topográfico' },
  { id: 'satellite', label: 'Satélite' },
  { id: 'hybrid', label: 'Híbrido' },
  { id: 'streets-vector', label: 'Calles' },
] as const

export type BasemapId = (typeof BASEMAP_OPTIONS)[number]['id']
export type ViewMode = '2d' | '3d'

export const DEFAULT_BASEMAP: BasemapId = 'topo-vector'
export const DEFAULT_VIEW_MODE: ViewMode = '2d'

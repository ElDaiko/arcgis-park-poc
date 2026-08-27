export const BASEMAP_OPTIONS = [
  {
    id: 'topo-vector',
    label: 'Topográfico',
    thumbnailUrl: '/basemaps/topo-vector.jpg',
  },
  {
    id: 'satellite',
    label: 'Satélite',
    thumbnailUrl: '/basemaps/satellite.jpg',
  },
  {
    id: 'hybrid',
    label: 'Híbrido',
    thumbnailUrl: '/basemaps/hybrid.jpg',
  },
  {
    id: 'streets-vector',
    label: 'Calles',
    thumbnailUrl: '/basemaps/streets-vector.jpg',
  },
] as const

export type BasemapId = (typeof BASEMAP_OPTIONS)[number]['id']
export type ViewMode = '2d' | '3d'

export const DEFAULT_BASEMAP: BasemapId = 'topo-vector'
export const DEFAULT_VIEW_MODE: ViewMode = '2d'

/** Categorías de puntos de interés en pois.geojson (`properties.categoria`). */
export const POI_CATEGORIES = [
  'atraccion',
  'gastronomia',
  'acuatico',
  'deporte',
  'servicio',
] as const

export type PoiCategory = (typeof POI_CATEGORIES)[number]

export interface PoiCategoryMeta {
  label: string
  /** Color de la categoría: pins 2D/3D, muestra del filtro y chip del detalle. */
  color: string
}

/** Única fuente de verdad de nombre y color por categoría. */
export const POI_CATEGORY_META: Record<PoiCategory, PoiCategoryMeta> = {
  atraccion: { label: 'Atracción', color: '#db0061' },
  gastronomia: { label: 'Gastronomía', color: '#ea580c' },
  acuatico: { label: 'Acuático', color: '#2563eb' },
  deporte: { label: 'Deporte', color: '#008444' },
  servicio: { label: 'Servicio', color: '#ca8a04' },
}

export function isPoiCategory(value: string | undefined): value is PoiCategory {
  return (POI_CATEGORIES as readonly (string | undefined)[]).includes(value)
}

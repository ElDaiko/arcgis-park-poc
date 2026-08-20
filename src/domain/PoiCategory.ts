/** Categorías de puntos de interés en pois.geojson (`properties.categoria`). */
export const POI_CATEGORIES = [
  'atraccion',
  'gastronomia',
  'acuatico',
  'deporte',
  'servicio',
] as const

export type PoiCategory = (typeof POI_CATEGORIES)[number]

export const POI_CATEGORY_META: Record<
  PoiCategory,
  { label: string; swatch: string }
> = {
  atraccion: { label: 'Atracción', swatch: '#db0061' },
  gastronomia: { label: 'Gastronomía', swatch: '#ea580c' },
  acuatico: { label: 'Acuático', swatch: '#2563eb' },
  deporte: { label: 'Deporte', swatch: '#008444' },
  servicio: { label: 'Servicio', swatch: '#ca8a04' },
}

export function isPoiCategory(value: string): value is PoiCategory {
  return (POI_CATEGORIES as readonly string[]).includes(value)
}

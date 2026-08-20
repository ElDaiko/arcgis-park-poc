/** Feature del parque seleccionado en el mapa (sin dependencias de ArcGIS). */
export interface MapFeature {
  name: string
  /** Categoría de POI o tipo de geometría (sendero, zona, etc.). */
  type: string
  /** Categoría tipográfica para chips (atraccion, gastronomia...). */
  category?: string
  description: string
  layerTitle: string
  /** URL de foto del lugar — campo `imagen` en GeoJSON. */
  imageUrl?: string
}

export const CATEGORY_LABELS: Record<string, string> = {
  atraccion: 'Atracción',
  gastronomia: 'Gastronomía',
  acuatico: 'Acuático',
  deporte: 'Deporte',
  servicio: 'Servicio',
  punto_interes: 'Punto de interés',
  zona_principal: 'Zona principal',
  sendero_principal: 'Sendero principal',
  acceso_discapacitados: 'Acceso universal',
  bano: 'Baños',
  parqueadero: 'Parqueadero',
  primeros_auxilios: 'Primeros auxilios',
  informacion: 'Información',
}

export function formatCategoryLabel(value: string): string {
  return CATEGORY_LABELS[value] ?? value
}

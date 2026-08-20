/** Feature del parque seleccionado en el mapa (sin dependencias de ArcGIS). */
export interface MapFeature {
  name: string
  type: string
  description: string
  layerTitle: string
  /** URL de foto del lugar — campo `imagen` en GeoJSON (local o externa). */
  imageUrl?: string
}

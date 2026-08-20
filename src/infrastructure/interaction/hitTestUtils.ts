import type Graphic from '@arcgis/core/Graphic'
import type GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import type Layer from '@arcgis/core/layers/Layer'

/** Prioridad al clic: la capa más específica gana (punto > línea > polígono). */
const LAYER_HIT_PRIORITY = [
  'pois',
  'infraestructura',
  'senderos',
  'parque',
] as const

export function pickBestGraphicHit(
  results: __esri.ViewHit[],
): __esri.GraphicHit | undefined {
  const graphicHits = results.filter(
    (result): result is __esri.GraphicHit => result.type === 'graphic',
  )

  for (const layerId of LAYER_HIT_PRIORITY) {
    const layerHits = graphicHits.filter(
      (candidate) => (candidate.layer as Layer | null)?.id === layerId,
    )

    if (layerHits.length > 0) {
      return layerHits.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))[0]
    }
  }

  return graphicHits.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))[0]
}

/**
 * hitTest a veces trae attributes incompletos.
 * Consultamos la capa por OBJECTID y conservamos siempre una geometría usable.
 */
export async function resolveGraphicWithAttributes(
  layer: GeoJSONLayer,
  graphic: Graphic,
): Promise<Graphic> {
  const objectId = graphic.getObjectId()

  if (objectId == null) {
    return graphic
  }

  const result = await layer.queryFeatures({
    objectIds: [objectId],
    outFields: ['*'],
    returnGeometry: true,
  })

  const resolved = result.features[0]

  if (!resolved) {
    return graphic
  }

  // Si la consulta no trajera geometría, reutilizamos la del hit.
  if (!resolved.geometry && graphic.geometry) {
    resolved.geometry = graphic.geometry.clone()
  }

  return resolved
}

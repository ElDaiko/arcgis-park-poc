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

interface GraphicHitCandidate {
  type: 'graphic'
  graphic: Graphic
  layer: Layer
  distance?: number
}

export function pickBestGraphicHit(
  results: readonly (__esri.ViewHit | __esri.MapViewViewHit)[],
): GraphicHitCandidate | undefined {
  const graphicHits = results.filter(
    (result) => result.type === 'graphic',
  ) as unknown as GraphicHitCandidate[]

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
 * GeoJSONLayer carga todos los datos en cliente, por lo que el graphic del
 * hitTest ya tiene los atributos completos. Solo hacemos la query de respaldo
 * si los atributos vienen vacíos (e.g. FeatureLayer remota en el futuro).
 */
export async function resolveGraphicWithAttributes(
  layer: GeoJSONLayer,
  graphic: Graphic,
): Promise<Graphic> {
  const attrs = graphic.attributes as Record<string, unknown> | null
  const populated =
    attrs != null && Object.values(attrs).filter((v) => v != null).length > 1

  if (populated) {
    return graphic
  }

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

  if (!resolved.geometry && graphic.geometry) {
    resolved.geometry = graphic.geometry.clone()
  }

  return resolved
}

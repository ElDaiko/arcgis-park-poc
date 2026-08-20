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
  results: __esri.MapViewViewHit[],
): __esri.GraphicHit | undefined {
  const graphicHits = results.filter(
    (result): result is __esri.GraphicHit => result.type === 'graphic',
  )

  for (const layerId of LAYER_HIT_PRIORITY) {
    const layerHits = graphicHits.filter(
      (candidate) => (candidate.layer as Layer).id === layerId,
    )

    if (layerHits.length > 0) {
      return layerHits.sort((a, b) => a.distance - b.distance)[0]
    }
  }

  return graphicHits.sort((a, b) => a.distance - b.distance)[0]
}

/** hitTest a veces devuelve attributes incompletos; consultamos la capa por OBJECTID. */
export async function resolveGraphicWithAttributes(
  layer: GeoJSONLayer,
  graphic: Graphic,
): Promise<Graphic> {
  const objectId = graphic.getObjectId()

  if (objectId != null) {
    const result = await layer.queryFeatures({
      objectIds: [objectId],
      outFields: ['*'],
      returnGeometry: false,
    })

    if (result.features[0]) {
      return result.features[0]
    }
  }

  return graphic
}

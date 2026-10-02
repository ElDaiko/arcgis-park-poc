import type FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import type Layer from '@arcgis/core/layers/Layer'
import {
  createInfrastructureRenderer,
  createParkRenderer,
  createPoi2dLabelClass,
  createPoi2dRenderer,
  createTrailsRenderer,
} from '../layers/renderers'

/**
 * Id canónico local de cada capa (coincide con los ids de las capas GeoJSON
 * locales y con la lógica de hitTest/filtros).
 */
export type CanonicalLayerId = 'parque' | 'senderos' | 'infraestructura' | 'pois'

/**
 * Item IDs de las capas del Web Map `tutucan` en AGOL. Son inmutables: si
 * alguien renombra una capa en el Web Map, el front la sigue reconociendo.
 */
const LAYER_ITEM_IDS: Record<string, CanonicalLayerId> = {
  b5048f839a084e3e8b22e9a89ec6e66f: 'parque',
  '2e4e90b21c954680b3eabfc6e916872d': 'senderos',
  '10ef0c75389841f99c804effb405aeb2': 'infraestructura',
  ea936080790c4e988880ec7f9b1e4729: 'pois',
}

/** Respaldo: nombre del servicio en la URL (`…/services/<nombre>/FeatureServer`). */
const LAYER_SERVICE_NAMES: Record<string, CanonicalLayerId> = {
  parque: 'parque',
  senderos: 'senderos',
  infraestructura: 'infraestructura',
  punto_de_interes: 'pois',
}

/** Último recurso: título de la capa en el Web Map. */
const LAYER_TITLES: Record<string, CanonicalLayerId> = {
  parque: 'parque',
  senderos: 'senderos',
  infraestructura: 'infraestructura',
  'punto de interes': 'pois',
  'puntos de interés': 'pois',
  pois: 'pois',
}

function serviceNameFromUrl(url: string | null | undefined): string | null {
  const match = /\/services\/([^/]+)\/FeatureServer/i.exec(url ?? '')
  return match ? match[1].toLowerCase() : null
}

/** Reconoce una capa del Web Map por item ID → servicio → título. */
export function canonicalIdForLayer(layer: Layer): CanonicalLayerId | null {
  const featureLayer = layer as FeatureLayer
  const itemId = featureLayer.portalItem?.id
  if (itemId && LAYER_ITEM_IDS[itemId]) {
    return LAYER_ITEM_IDS[itemId]
  }

  const serviceName = serviceNameFromUrl(featureLayer.url)
  if (serviceName && LAYER_SERVICE_NAMES[serviceName]) {
    return LAYER_SERVICE_NAMES[serviceName]
  }

  const title = (layer.title ?? '').trim().toLowerCase()
  return LAYER_TITLES[title] ?? null
}

function applyLocalStyle(layer: FeatureLayer, id: CanonicalLayerId): void {
  switch (id) {
    case 'parque':
      layer.renderer = createParkRenderer()
      break
    case 'senderos':
      layer.renderer = createTrailsRenderer()
      break
    case 'infraestructura':
      layer.renderer = createInfrastructureRenderer()
      break
    case 'pois':
      layer.renderer = createPoi2dRenderer()
      layer.labelingInfo = [createPoi2dLabelClass()]
      layer.labelsVisible = true
      break
  }
}

/**
 * Prepara una capa del Web Map para comportarse como su equivalente local:
 * - Sobrescribe el renderer (y etiquetas de POIs) con el estilo local.
 * - Normaliza el `id` al canónico (para hitTest/filtros).
 * - Desactiva el popup nativo (la app usa FeatureDetailPanel de React).
 *
 * Devuelve el id canónico aplicado, o null si la capa no es conocida.
 */
export function prepareWebMapLayer(layer: Layer): CanonicalLayerId | null {
  const canonicalId = canonicalIdForLayer(layer)

  if (!canonicalId) {
    // Antes una capa desconocida perdía estilo e interacción en silencio.
    console.warn(
      `[Web Map] Capa no reconocida: "${layer.title}" (${layer.id}). ` +
        'Se muestra con el estilo de AGOL y sin interacción local.',
    )
    return null
  }

  if (layer.type === 'feature') {
    const featureLayer = layer as FeatureLayer
    applyLocalStyle(featureLayer, canonicalId)
    featureLayer.popupEnabled = false
    featureLayer.outFields = ['*']
  }

  // Id canónico para que pickBestGraphicHit y los filtros funcionen igual
  // que con las capas GeoJSON locales.
  layer.id = canonicalId

  return canonicalId
}

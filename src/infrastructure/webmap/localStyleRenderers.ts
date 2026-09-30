import type FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import type Layer from '@arcgis/core/layers/Layer'
import LabelClass from '@arcgis/core/layers/support/LabelClass'
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer'
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer'
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol'
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol'
import TextSymbol from '@arcgis/core/symbols/TextSymbol'
import { createEsriPinSymbol } from '../layers/symbols/esriPins'

/** Etiqueta de nombre para POIs (equivalente a createPoi2dLabelClass local). */
function createPoiLabelClass(): LabelClass {
  return new LabelClass({
    labelExpressionInfo: { expression: '$feature.nombre' },
    symbol: new TextSymbol({
      color: '#1b1c1c',
      haloColor: '#ffffff',
      haloSize: 1.5,
      font: {
        family: 'Source Sans 3',
        size: 10,
        weight: 'bold',
      },
    }),
    labelPlacement: 'above-center',
    minScale: 8000,
  })
}

/**
 * Renderers que replican el estilo del mapa LOCAL (mismos símbolos que las
 * fábricas en layers/). Se aplican sobre las capas del Web Map de AGOL para
 * demostrar que el front puede sobrescribir la presentación del mapa alojado.
 *
 * Las funciones crean instancias nuevas en cada llamada (los renderers de
 * ArcGIS no deben compartirse entre capas de vistas distintas).
 */

export function createParkRenderer(): SimpleRenderer {
  return new SimpleRenderer({
    symbol: new SimpleFillSymbol({
      color: [219, 0, 97, 0.22],
      outline: { color: '#db0061', width: 2 },
    }),
  })
}

export function createTrailsRenderer(): UniqueValueRenderer {
  return new UniqueValueRenderer({
    field: 'tipo',
    defaultSymbol: new SimpleLineSymbol({ color: '#008444', width: 3 }),
    uniqueValueInfos: [
      {
        value: 'sendero_principal',
        symbol: new SimpleLineSymbol({ color: '#008444', width: 4 }),
      },
      {
        value: 'acceso_discapacitados',
        symbol: new SimpleLineSymbol({
          color: '#006d37',
          width: 3,
          style: 'dash',
        }),
      },
    ],
  })
}

export function createInfrastructureRenderer(): UniqueValueRenderer {
  return new UniqueValueRenderer({
    field: 'tipo',
    defaultSymbol: createEsriPinSymbol('blue', 24),
    uniqueValueInfos: [
      { value: 'bano', symbol: createEsriPinSymbol('yellow', 26) },
      { value: 'parqueadero', symbol: createEsriPinSymbol('green', 28) },
      { value: 'primeros_auxilios', symbol: createEsriPinSymbol('red', 26) },
      { value: 'informacion', symbol: createEsriPinSymbol('orange', 26) },
    ],
  })
}

export function createPoiRenderer(): UniqueValueRenderer {
  return new UniqueValueRenderer({
    field: 'categoria',
    defaultSymbol: createEsriPinSymbol('blue', 24),
    uniqueValueInfos: [
      { value: 'atraccion', label: 'Atracción', symbol: createEsriPinSymbol('red', 28) },
      { value: 'gastronomia', label: 'Gastronomía', symbol: createEsriPinSymbol('orange', 26) },
      { value: 'acuatico', label: 'Acuático', symbol: createEsriPinSymbol('blue', 26) },
      { value: 'deporte', label: 'Deporte', symbol: createEsriPinSymbol('green', 26) },
      { value: 'servicio', label: 'Servicio', symbol: createEsriPinSymbol('yellow', 26) },
    ],
  })
}

/**
 * Id canónico local para cada capa (coincide con los ids que usan las
 * fábricas locales y la lógica de hitTest/filtros).
 */
export type CanonicalLayerId =
  | 'parque'
  | 'senderos'
  | 'infraestructura'
  | 'pois'

/** Mapea el título de una capa del Web Map a su id canónico local. */
export function canonicalIdForLayerTitle(
  title: string | null | undefined,
): CanonicalLayerId | null {
  const normalized = (title ?? '').trim().toLowerCase()

  switch (normalized) {
    case 'parque':
      return 'parque'
    case 'senderos':
      return 'senderos'
    case 'infraestructura':
      return 'infraestructura'
    case 'punto de interes':
    case 'puntos de interés':
    case 'pois':
      return 'pois'
    default:
      return null
  }
}

/**
 * Mapea el título de una capa del Web Map (como está en AGOL) al renderer
 * local correspondiente. Devuelve null si no hay coincidencia conocida.
 *
 * Los títulos provienen del Web Map alojado: 'parque', 'senderos',
 * 'infraestructura', 'Punto de Interes'.
 */
export function rendererForLayerTitle(
  title: string | null | undefined,
): SimpleRenderer | UniqueValueRenderer | null {
  switch (canonicalIdForLayerTitle(title)) {
    case 'parque':
      return createParkRenderer()
    case 'senderos':
      return createTrailsRenderer()
    case 'infraestructura':
      return createInfrastructureRenderer()
    case 'pois':
      return createPoiRenderer()
    default:
      return null
  }
}

/**
 * Prepara una capa del Web Map para comportarse como su equivalente local:
 * - Sobrescribe el renderer con el estilo local.
 * - Normaliza el `id` de la capa al id canónico (para hitTest/filtros).
 * - Desactiva el popup nativo (la app usa FeatureDetailPanel de React).
 *
 * Devuelve el id canónico aplicado, o null si la capa no es conocida.
 */
export function prepareWebMapLayer(layer: Layer): CanonicalLayerId | null {
  const canonicalId = canonicalIdForLayerTitle(layer.title)

  if (!canonicalId) {
    return null
  }

  const featureLayer = layer as FeatureLayer

  if ('renderer' in featureLayer) {
    featureLayer.renderer = rendererForLayerTitle(layer.title)!
  }

  // Etiquetas de nombre solo para POIs (igual que el mapa local).
  if (canonicalId === 'pois' && 'labelingInfo' in featureLayer) {
    featureLayer.labelingInfo = [createPoiLabelClass()]
    featureLayer.labelsVisible = true
  }

  // Id canónico para que pickBestGraphicHit y los filtros funcionen igual
  // que con las capas GeoJSON locales.
  layer.id = canonicalId

  if ('popupEnabled' in featureLayer) {
    featureLayer.popupEnabled = false
  }

  if ('outFields' in featureLayer) {
    featureLayer.outFields = ['*']
  }

  return canonicalId
}

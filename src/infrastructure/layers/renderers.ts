import LabelClass from '@arcgis/core/layers/support/LabelClass'
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer'
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer'
import IconSymbol3DLayer from '@arcgis/core/symbols/IconSymbol3DLayer'
import LabelSymbol3D from '@arcgis/core/symbols/LabelSymbol3D'
import PointSymbol3D from '@arcgis/core/symbols/PointSymbol3D'
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol'
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol'
import TextSymbol from '@arcgis/core/symbols/TextSymbol'
import TextSymbol3DLayer from '@arcgis/core/symbols/TextSymbol3DLayer'
import {
  POI_CATEGORIES,
  POI_CATEGORY_META,
  type PoiCategory,
} from '../../domain/PoiCategory'
import { createEsriPinSymbol, createPinSymbol, PIN_COLORS } from './symbols/esriPins'

/**
 * Estilo de todas las capas del parque. Lo usan tanto las capas GeoJSON
 * locales (layers/) como las capas del Web Map de AGOL (webmap/), así ambas
 * pestañas se ven idénticas por construcción.
 *
 * Cada llamada crea instancias nuevas: los renderers de ArcGIS no deben
 * compartirse entre capas de mapas distintos.
 */

const POI_DEFAULT_COLOR = PIN_COLORS.blue
/** Las atracciones se destacan con un pin algo mayor. */
const POI_PIN_SIZE: Partial<Record<PoiCategory, number>> = { atraccion: 28 }

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

/** Pins 2D por categoría, con color y nombre del catálogo de dominio. */
export function createPoi2dRenderer(): UniqueValueRenderer {
  return new UniqueValueRenderer({
    field: 'categoria',
    defaultSymbol: createPinSymbol(POI_DEFAULT_COLOR, 24),
    uniqueValueInfos: POI_CATEGORIES.map((category) => ({
      value: category,
      label: POI_CATEGORY_META[category].label,
      symbol: createPinSymbol(
        POI_CATEGORY_META[category].color,
        POI_PIN_SIZE[category] ?? 26,
      ),
    })),
  })
}

/** Iconos 3D por categoría (mismos colores que en 2D). */
export function createPoi3dRenderer(): UniqueValueRenderer {
  return new UniqueValueRenderer({
    field: 'categoria',
    defaultSymbol: createPoi3dSymbol(POI_DEFAULT_COLOR),
    uniqueValueInfos: POI_CATEGORIES.map((category) => ({
      value: category,
      label: POI_CATEGORY_META[category].label,
      symbol: createPoi3dSymbol(POI_CATEGORY_META[category].color),
    })),
  })
}

function createPoi3dSymbol(color: string): PointSymbol3D {
  return new PointSymbol3D({
    symbolLayers: [
      new IconSymbol3DLayer({
        size: 24,
        material: { color },
        outline: { color: '#ffffff', size: 1.5 },
        resource: { primitive: 'circle' },
      }),
    ],
  })
}

/** Nombre del POI sobre el pin (2D), visible al acercar el zoom. */
export function createPoi2dLabelClass(): LabelClass {
  return new LabelClass({
    labelExpressionInfo: { expression: '$feature.nombre' },
    symbol: new TextSymbol({
      color: '#1b1c1c',
      haloColor: '#ffffff',
      haloSize: 1.5,
      font: {
        // Las etiquetas 2D usan las fuentes de static.arcgis.com/fonts, donde
        // Source Sans 3 no existe (404); Noto Sans es la más cercana disponible.
        family: 'Noto Sans',
        size: 10,
        weight: 'bold',
      },
    }),
    labelPlacement: 'above-center',
    minScale: 8000,
  })
}

/** Nombre del POI en 3D (SceneView usa fuentes del navegador). */
export function createPoi3dLabelClass(): LabelClass {
  return new LabelClass({
    labelExpressionInfo: { expression: '$feature.nombre' },
    symbol: new LabelSymbol3D({
      symbolLayers: [
        new TextSymbol3DLayer({
          material: { color: '#1b1c1c' },
          size: 16,
          halo: { color: '#ffffff', size: 2 },
          font: {
            family: 'Source Sans 3',
            weight: 'bold',
          },
        }),
      ],
    }),
    labelPlacement: 'above-center',
  })
}

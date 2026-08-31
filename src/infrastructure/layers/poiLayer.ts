import LabelClass from '@arcgis/core/layers/support/LabelClass'
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import Point from '@arcgis/core/geometry/Point'
import PopupTemplate from '@arcgis/core/PopupTemplate'
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer'
import IconSymbol3DLayer from '@arcgis/core/symbols/IconSymbol3DLayer'
import LabelSymbol3D from '@arcgis/core/symbols/LabelSymbol3D'
import PointSymbol3D from '@arcgis/core/symbols/PointSymbol3D'
import TextSymbol from '@arcgis/core/symbols/TextSymbol'
import TextSymbol3DLayer from '@arcgis/core/symbols/TextSymbol3DLayer'
import { createEsriPinSymbol } from './symbols/esriPins'

export const POIS_GEOJSON_URL = '/data/pois.geojson'

/**
 * Categorías del parque (campo `categoria` en pois.geojson):
 * atraccion | gastronomia | acuatico | deporte | servicio
 */
export function createPoiLayer(): GeoJSONLayer {
  return new GeoJSONLayer({
    id: 'pois',
    url: POIS_GEOJSON_URL,
    title: 'Puntos de interés',
    listMode: 'show',
    popupEnabled: false,
    outFields: ['*'],
    elevationInfo: { mode: 'relative-to-ground', offset: 2 },
    renderer: createPoi2dRenderer(),
    popupTemplate: new PopupTemplate({
      title: '{nombre}',
      content: `
        <div style="font-family: 'Source Sans 3', system-ui, sans-serif; padding: 4px 0;">
          <p style="margin: 0 0 8px; display: inline-block; padding: 4px 12px; border-radius: 999px; background: #fce3ed; color: #ae004b; font-size: 12px; font-weight: 600;">
            {categoria}
          </p>
          <p style="margin: 0; color: #5b3f45; font-size: 15px; line-height: 1.5;">
            {descripcion}
          </p>
        </div>
      `,
    }),
    labelingInfo: [
      new LabelClass({
        labelExpressionInfo: {
          expression: '$feature.nombre',
        },
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
      }),
    ],
  })
}

function createPoi2dRenderer(): UniqueValueRenderer {
  return new UniqueValueRenderer({
    field: 'categoria',
    defaultSymbol: createEsriPinSymbol('blue', 24),
    uniqueValueInfos: [
      {
        value: 'atraccion',
        label: 'Atracción',
        symbol: createEsriPinSymbol('red', 28),
      },
      {
        value: 'gastronomia',
        label: 'Gastronomía',
        symbol: createEsriPinSymbol('orange', 26),
      },
      {
        value: 'acuatico',
        label: 'Acuático',
        symbol: createEsriPinSymbol('blue', 26),
      },
      {
        value: 'deporte',
        label: 'Deporte',
        symbol: createEsriPinSymbol('green', 26),
      },
      {
        value: 'servicio',
        label: 'Servicio',
        symbol: createEsriPinSymbol('yellow', 26),
      },
    ],
  })
}

function createPoi3dRenderer(): UniqueValueRenderer {
  return new UniqueValueRenderer({
    field: 'categoria',
    defaultSymbol: createPoi3dSymbol('#2878d0'),
    uniqueValueInfos: [
      {
        value: 'atraccion',
        label: 'Atracción',
        symbol: createPoi3dSymbol('#e53935'),
      },
      {
        value: 'gastronomia',
        label: 'Gastronomía',
        symbol: createPoi3dSymbol('#f28c28'),
      },
      {
        value: 'acuatico',
        label: 'Acuático',
        symbol: createPoi3dSymbol('#2878d0'),
      },
      {
        value: 'deporte',
        label: 'Deporte',
        symbol: createPoi3dSymbol('#16a05d'),
      },
      {
        value: 'servicio',
        label: 'Servicio',
        symbol: createPoi3dSymbol('#e6b800'),
      },
    ],
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

function createPoi2dLabelClass(): LabelClass {
  return new LabelClass({
    labelExpressionInfo: {
      expression: '$feature.nombre',
    },
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

function createPoi3dLabelClass(): LabelClass {
  return new LabelClass({
    labelExpressionInfo: {
      expression: '$feature.nombre',
    },
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

export function setPoiViewMode(
  poiLayer: GeoJSONLayer,
  viewMode: '2d' | '3d',
): void {
  poiLayer.renderer =
    viewMode === '3d' ? createPoi3dRenderer() : createPoi2dRenderer()
  poiLayer.labelingInfo = [
    viewMode === '3d' ? createPoi3dLabelClass() : createPoi2dLabelClass(),
  ]
}

export async function getEntranceCoordinates(
  poiLayer: GeoJSONLayer,
): Promise<{ longitude: number; latitude: number }> {
  await poiLayer.load()

  const result = await poiLayer.queryFeatures({
    where: "nombre = 'Entrada Tutucán'",
    returnGeometry: true,
    outFields: ['nombre'],
  })

  const entrance = result.features[0]?.geometry

  if (!entrance || entrance.type !== 'point') {
    throw new Error(
      "pois.geojson no contiene el punto 'Entrada Tutucán'.",
    )
  }

  const point = entrance as Point

  return {
    longitude: point.longitude,
    latitude: point.latitude,
  }
}

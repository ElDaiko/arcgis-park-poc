import LabelClass from '@arcgis/core/layers/support/LabelClass'
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import Point from '@arcgis/core/geometry/Point'
import PopupTemplate from '@arcgis/core/PopupTemplate'
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer'
import TextSymbol from '@arcgis/core/symbols/TextSymbol'
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
    renderer: new UniqueValueRenderer({
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
    }),
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

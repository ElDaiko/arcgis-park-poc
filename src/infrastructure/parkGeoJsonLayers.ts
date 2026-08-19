import Point from '@arcgis/core/geometry/Point'
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer'
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer'
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol'
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol'

/** GeoJSON solo con polígonos — GeoJSONLayer exige un tipo de geometría por capa. */
export const PARK_BOUNDARY_GEOJSON_URL = '/data/parque.geojson'

/** GeoJSON solo con puntos — agrega aquí nuevos POIs. */
export const POIS_GEOJSON_URL = '/data/pois.geojson'

const POPUP_TEMPLATE = {
  title: '{nombre}',
  content: '{descripcion}',
} as const

export function createParkBoundaryLayer(): GeoJSONLayer {
  return new GeoJSONLayer({
    url: PARK_BOUNDARY_GEOJSON_URL,
    title: 'Parque Recreativo Comfama',
    renderer: new SimpleRenderer({
      symbol: new SimpleFillSymbol({
        color: [34, 197, 94, 0.22],
        outline: {
          color: '#15803d',
          width: 2,
        },
      }),
    }),
    popupTemplate: POPUP_TEMPLATE,
  })
}

export function createPoiLayer(): GeoJSONLayer {
  const defaultSymbol = new SimpleMarkerSymbol({
    color: '#2563eb',
    size: 10,
    outline: { color: '#ffffff', width: 2 },
  })

  return new GeoJSONLayer({
    url: POIS_GEOJSON_URL,
    title: 'Puntos de interés',
    renderer: new UniqueValueRenderer({
      field: 'tipo',
      defaultSymbol,
      uniqueValueInfos: [
        {
          value: 'punto_interes',
          symbol: new SimpleMarkerSymbol({
            color: '#dc2626',
            size: 12,
            outline: { color: '#ffffff', width: 2 },
          }),
        },
        {
          value: 'atraccion',
          symbol: new SimpleMarkerSymbol({
            color: '#2563eb',
            size: 11,
            outline: { color: '#ffffff', width: 2 },
          }),
        },
        {
          value: 'servicio',
          symbol: new SimpleMarkerSymbol({
            color: '#ca8a04',
            size: 10,
            outline: { color: '#ffffff', width: 2 },
          }),
        },
      ],
    }),
    popupTemplate: POPUP_TEMPLATE,
  })
}

export async function getEntranceCoordinates(
  poiLayer: GeoJSONLayer,
): Promise<{ longitude: number; latitude: number }> {
  await poiLayer.load()

  const result = await poiLayer.queryFeatures({
    where: "tipo = 'punto_interes'",
    returnGeometry: true,
    outFields: ['nombre'],
  })

  const entrance = result.features[0]?.geometry

  if (!entrance || entrance.type !== 'point') {
    throw new Error(
      'pois.geojson no contiene un punto de entrada (tipo = punto_interes).',
    )
  }

  const point = entrance as Point

  return {
    longitude: point.longitude,
    latitude: point.latitude,
  }
}

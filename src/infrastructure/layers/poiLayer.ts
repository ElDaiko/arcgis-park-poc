import Point from '@arcgis/core/geometry/Point'
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer'
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol'

export const POIS_GEOJSON_URL = '/data/pois.geojson'

export function createPoiLayer(): GeoJSONLayer {
  const defaultSymbol = new SimpleMarkerSymbol({
    color: '#2563eb',
    size: 10,
    outline: { color: '#ffffff', width: 2 },
  })

  return new GeoJSONLayer({
    id: 'pois',
    url: POIS_GEOJSON_URL,
    title: 'Puntos de interés',
    listMode: 'show',
    popupEnabled: false,
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

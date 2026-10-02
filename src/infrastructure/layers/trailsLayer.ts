import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import { createTrailsRenderer } from './renderers'

export const TRAILS_GEOJSON_URL = '/data/senderos.geojson'

export function createTrailsLayer(): GeoJSONLayer {
  return new GeoJSONLayer({
    id: 'senderos',
    url: TRAILS_GEOJSON_URL,
    title: 'Senderos',
    listMode: 'show',
    popupEnabled: false,
    elevationInfo: {
      mode: 'on-the-ground',
    },
    renderer: createTrailsRenderer(),
  })
}

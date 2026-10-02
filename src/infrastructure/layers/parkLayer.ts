import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import { createParkRenderer } from './renderers'

export const PARK_BOUNDARY_GEOJSON_URL = '/data/parque.geojson'

export function createParkBoundaryLayer(): GeoJSONLayer {
  return new GeoJSONLayer({
    id: 'parque',
    url: PARK_BOUNDARY_GEOJSON_URL,
    title: 'Parque Recreativo Comfama',
    listMode: 'show',
    popupEnabled: false,
    elevationInfo: {
      mode: 'on-the-ground',
    },
    renderer: createParkRenderer(),
  })
}

import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import { createInfrastructureRenderer } from './renderers'

export const INFRASTRUCTURE_GEOJSON_URL = '/data/infraestructura.geojson'

export function createInfrastructureLayer(): GeoJSONLayer {
  return new GeoJSONLayer({
    id: 'infraestructura',
    url: INFRASTRUCTURE_GEOJSON_URL,
    title: 'Infraestructura',
    listMode: 'show',
    popupEnabled: false,
    outFields: ['*'],
    elevationInfo: { mode: 'relative-to-ground', offset: 2 },
    renderer: createInfrastructureRenderer(),
  })
}

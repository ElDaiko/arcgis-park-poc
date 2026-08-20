import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer'
import { createEsriPinSymbol } from './symbols/esriPins'

export const INFRASTRUCTURE_GEOJSON_URL = '/data/infraestructura.geojson'

export function createInfrastructureLayer(): GeoJSONLayer {
  return new GeoJSONLayer({
    id: 'infraestructura',
    url: INFRASTRUCTURE_GEOJSON_URL,
    title: 'Infraestructura',
    listMode: 'show',
    popupEnabled: false,
    renderer: new UniqueValueRenderer({
      field: 'tipo',
      defaultSymbol: createEsriPinSymbol('blue', 24),
      uniqueValueInfos: [
        {
          value: 'bano',
          symbol: createEsriPinSymbol('yellow', 26),
        },
        {
          value: 'parqueadero',
          symbol: createEsriPinSymbol('green', 28),
        },
        {
          value: 'primeros_auxilios',
          symbol: createEsriPinSymbol('red', 26),
        },
        {
          value: 'informacion',
          symbol: createEsriPinSymbol('orange', 26),
        },
      ],
    }),
  })
}

import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer'
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol'

export const PARK_BOUNDARY_GEOJSON_URL = '/data/parque.geojson'

export function createParkBoundaryLayer(): GeoJSONLayer {
  return new GeoJSONLayer({
    id: 'parque',
    url: PARK_BOUNDARY_GEOJSON_URL,
    title: 'Parque Recreativo Comfama',
    listMode: 'show',
    popupEnabled: false,
    renderer: new SimpleRenderer({
      symbol: new SimpleFillSymbol({
        color: [34, 197, 94, 0.22],
        outline: {
          color: '#15803d',
          width: 2,
        },
      }),
    }),
  })
}

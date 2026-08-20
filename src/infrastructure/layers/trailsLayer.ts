import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer'
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol'

export const TRAILS_GEOJSON_URL = '/data/senderos.geojson'

export function createTrailsLayer(): GeoJSONLayer {
  return new GeoJSONLayer({
    id: 'senderos',
    url: TRAILS_GEOJSON_URL,
    title: 'Senderos',
    listMode: 'show',
    popupEnabled: false,
    renderer: new UniqueValueRenderer({
      field: 'tipo',
      defaultSymbol: new SimpleLineSymbol({
        color: '#008444',
        width: 3,
      }),
      uniqueValueInfos: [
        {
          value: 'sendero_principal',
          symbol: new SimpleLineSymbol({
            color: '#008444',
            width: 4,
          }),
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
    }),
  })
}

import Graphic from '@arcgis/core/Graphic'
import Point from '@arcgis/core/geometry/Point'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import ObjectSymbol3DLayer from '@arcgis/core/symbols/ObjectSymbol3DLayer'
import PointSymbol3D from '@arcgis/core/symbols/PointSymbol3D'
import TextSymbol3DLayer from '@arcgis/core/symbols/TextSymbol3DLayer'

const PRESCHOOL_LOCATION = {
  longitude: -75.3787882604763,
  latitude: 6.1375198901975985,
}

/** Estructura temporal de prueba para validar objetos 3D sobre un POI. */
export function createTemporaryPreschoolLayer(): GraphicsLayer {
  const layer = new GraphicsLayer({
    id: 'estructura-prescolar-temporal',
    title: 'Estructura temporal · Prescolar Comfama',
    listMode: 'show',
    visible: false,
    elevationInfo: {
      mode: 'relative-to-ground',
    },
  })

  const point = new Point({
    longitude: PRESCHOOL_LOCATION.longitude,
    latitude: PRESCHOOL_LOCATION.latitude,
  })

  layer.addMany([
    new Graphic({
      geometry: point,
      attributes: {
        nombre: 'Prescolar Comfama',
        tipo: 'estructura_temporal',
        altura: 8,
      },
      symbol: new PointSymbol3D({
        symbolLayers: [
          new ObjectSymbol3DLayer({
            anchor: 'bottom',
            width: 18,
            depth: 14,
            height: 8,
            material: { color: '#db0061' },
            resource: { primitive: 'cube' },
          }),
        ],
      }),
    }),
    new Graphic({
      geometry: point,
      attributes: {
        nombre: 'Prescolar Comfama',
        tipo: 'etiqueta_estructura_temporal',
      },
      symbol: new PointSymbol3D({
        verticalOffset: {
          screenLength: 28,
          maxWorldLength: 40,
          minWorldLength: 10,
        },
        symbolLayers: [
          new TextSymbol3DLayer({
            text: 'Prescolar Comfama',
            material: { color: '#1b1c1c' },
            size: 15,
            halo: { color: '#ffffff', size: 2 },
            font: {
              family: 'Source Sans 3',
              weight: 'bold',
            },
          }),
        ],
      }),
    }),
  ])

  return layer
}

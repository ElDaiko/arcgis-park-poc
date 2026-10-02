import type Layer from '@arcgis/core/layers/Layer'
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import { createInfrastructureLayer } from './infrastructureLayer'
import { createParkBoundaryLayer } from './parkLayer'
import { createPoiLayer } from './poiLayer'
import { createTrailsLayer } from './trailsLayer'
import { createTemporaryPreschoolLayer } from './temporaryPreschoolLayer'

export { setPoiViewMode } from './poiLayer'

export interface OperationalLayers {
  layers: Layer[]
  poiLayer: GeoJSONLayer
  temporary3dLayer: Layer
}

/** Capas operacionales del mapa, en orden de dibujado (abajo → arriba). */
export function createOperationalLayers(): OperationalLayers {
  const poiLayer = createPoiLayer()
  const temporary3dLayer = createTemporaryPreschoolLayer()

  return {
    layers: [
      createParkBoundaryLayer(),
      createTrailsLayer(),
      createInfrastructureLayer(),
      poiLayer,
    ],
    poiLayer,
    temporary3dLayer,
  }
}

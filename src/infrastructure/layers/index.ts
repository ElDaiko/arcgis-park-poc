import type Layer from '@arcgis/core/layers/Layer'
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import { createParkBoundaryLayer } from './parkLayer'
import { createPoiLayer } from './poiLayer'
import { createTrailsLayer } from './trailsLayer'

export { getEntranceCoordinates } from './poiLayer'

export interface OperationalLayers {
  layers: Layer[]
  poiLayer: GeoJSONLayer
}

/** Capas operacionales del mapa, en orden de dibujado (abajo → arriba). */
export function createOperationalLayers(): OperationalLayers {
  const poiLayer = createPoiLayer()

  return {
    layers: [createParkBoundaryLayer(), createTrailsLayer(), poiLayer],
    poiLayer,
  }
}

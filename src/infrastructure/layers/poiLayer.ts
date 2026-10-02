import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import type LabelClass from '@arcgis/core/layers/support/LabelClass'
import type UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer'
import {
  createPoi2dLabelClass,
  createPoi2dRenderer,
  createPoi3dLabelClass,
  createPoi3dRenderer,
} from './renderers'

export const POIS_GEOJSON_URL = '/data/pois.geojson'

// Lazy singletons — se crean una sola vez y se reutilizan en cada switch 2D/3D.
let _renderer2d: UniqueValueRenderer | null = null
let _renderer3d: UniqueValueRenderer | null = null
let _label2d: LabelClass | null = null
let _label3d: LabelClass | null = null

function getPoi2dRenderer(): UniqueValueRenderer {
  return (_renderer2d ??= createPoi2dRenderer())
}
function getPoi3dRenderer(): UniqueValueRenderer {
  return (_renderer3d ??= createPoi3dRenderer())
}
function getPoi2dLabelClass(): LabelClass {
  return (_label2d ??= createPoi2dLabelClass())
}
function getPoi3dLabelClass(): LabelClass {
  return (_label3d ??= createPoi3dLabelClass())
}

/** Puntos de interés; el estilo por `categoria` sale del catálogo de dominio. */
export function createPoiLayer(): GeoJSONLayer {
  return new GeoJSONLayer({
    id: 'pois',
    url: POIS_GEOJSON_URL,
    title: 'Puntos de interés',
    listMode: 'show',
    popupEnabled: false,
    outFields: ['nombre', 'categoria', 'descripcion', 'imagen'],
    elevationInfo: { mode: 'relative-to-ground', offset: 2 },
    renderer: getPoi2dRenderer(),
    labelingInfo: [getPoi2dLabelClass()],
  })
}

export function setPoiViewMode(
  poiLayer: GeoJSONLayer,
  viewMode: '2d' | '3d',
): void {
  poiLayer.renderer = viewMode === '3d' ? getPoi3dRenderer() : getPoi2dRenderer()
  poiLayer.labelingInfo = [
    viewMode === '3d' ? getPoi3dLabelClass() : getPoi2dLabelClass(),
  ]
}

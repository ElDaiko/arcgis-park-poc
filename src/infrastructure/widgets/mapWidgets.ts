import type Layer from '@arcgis/core/layers/Layer'
import type MapView from '@arcgis/core/views/MapView'
import type SceneView from '@arcgis/core/views/SceneView'
import Expand from '@arcgis/core/widgets/Expand'
import LayerList from '@arcgis/core/widgets/LayerList'
import Legend from '@arcgis/core/widgets/Legend'

export type ActiveView = MapView | SceneView

/** LayerList siempre visible (debajo del filtro de categorías). */
export function setupLayerList(view: ActiveView): LayerList {
  const layerList = new LayerList({ view })
  view.ui.add(layerList, 'top-left')
  return layerList
}

export function setupLegend(view: ActiveView, poiLayer: Layer): Expand {
  const legend = new Legend({
    view,
    layerInfos: [{ layer: poiLayer, title: 'Categorías del parque' }],
  })

  const expand = new Expand({
    view,
    content: legend,
    expanded: false,
    expandTooltip: 'Leyenda de categorías',
  })

  view.ui.add(expand, 'bottom-right')
  return expand
}

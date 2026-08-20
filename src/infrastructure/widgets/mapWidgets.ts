import type Graphic from '@arcgis/core/Graphic'
import type GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import type MapView from '@arcgis/core/views/MapView'
import type SceneView from '@arcgis/core/views/SceneView'
import LayerList from '@arcgis/core/widgets/LayerList'
import Legend from '@arcgis/core/widgets/Legend'
import Expand from '@arcgis/core/widgets/Expand'

export type ActiveView = MapView | SceneView

export function setupLayerList(view: ActiveView): LayerList {
  const layerList = new LayerList({ view })
  view.ui.add(layerList, 'top-left')
  return layerList
}

export function setupLegend(view: ActiveView, poiLayer: GeoJSONLayer): Expand {
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

export async function highlightGraphic(
  view: ActiveView,
  layer: GeoJSONLayer,
  graphic: Graphic,
  currentHighlight: IHandle | null,
): Promise<IHandle | null> {
  currentHighlight?.remove()
  const layerView = await view.whenLayerView(layer)
  return layerView.highlight(graphic)
}

export function clearMapSelection(
  _view: ActiveView,
  highlight: IHandle | null,
): IHandle | null {
  highlight?.remove()
  return null
}

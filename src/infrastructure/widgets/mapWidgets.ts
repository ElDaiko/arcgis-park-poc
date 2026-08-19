import type Graphic from '@arcgis/core/Graphic'
import type GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import type MapView from '@arcgis/core/views/MapView'
import LayerList from '@arcgis/core/widgets/LayerList'

export function setupLayerList(view: MapView): LayerList {
  const layerList = new LayerList({ view })
  view.ui.add(layerList, 'top-left')
  return layerList
}

export async function highlightGraphic(
  view: MapView,
  layer: GeoJSONLayer,
  graphic: Graphic,
  currentHighlight: IHandle | null,
): Promise<IHandle | null> {
  currentHighlight?.remove()
  const layerView = await view.whenLayerView(layer)
  return layerView.highlight(graphic)
}

export function clearMapSelection(
  _view: MapView,
  highlight: IHandle | null,
): IHandle | null {
  highlight?.remove()
  return null
}

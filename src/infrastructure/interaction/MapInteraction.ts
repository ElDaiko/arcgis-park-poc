import type Point from '@arcgis/core/geometry/Point'
import * as projection from '@arcgis/core/geometry/projection'
import SpatialReference from '@arcgis/core/geometry/SpatialReference'
import type Layer from '@arcgis/core/layers/Layer'
import type { Coordinate } from '../../domain/Coordinate'
import type { MapCallbacks } from '../../domain/IMapService'
import { toMapFeature } from '../mappers/mapFeatureMapper'
import type { ActiveView } from '../widgets/mapWidgets'
import {
  pickBestGraphicHit,
  resolveGraphicWithAttributes,
  type QueryableLayer,
} from './hitTestUtils'

const WGS84 = new SpatialReference({ wkid: 4326 })
const MAGNA_SIRGAS_NATIONAL_ORIGIN = new SpatialReference({ wkid: 9377 })
const FEATURE_ZOOM = 17

/**
 * Convierte el punto del clic a WGS84 (grados) y MAGNA-SIRGAS Origen Nacional
 * (metros). Requiere haber esperado `projection.load()`.
 */
export function toCoordinate(mapPoint: Point): Coordinate {
  const pointWgs84 = projection.project(mapPoint, WGS84) as Point
  const pointMagna = projection.project(
    pointWgs84,
    MAGNA_SIRGAS_NATIONAL_ORIGIN,
  ) as Point

  return {
    latitude: pointWgs84.latitude,
    longitude: pointWgs84.longitude,
    x: pointMagna.x,
    y: pointMagna.y,
  }
}

/** Separa por tipo para que TypeScript resuelva el LayerView concreto (con highlight). */
function whenQueryableLayerView(view: ActiveView, layer: QueryableLayer) {
  return layer.type === 'geojson'
    ? view.whenLayerView(layer)
    : view.whenLayerView(layer)
}

/**
 * Interactividad común de los mapas del parque (local y Web Map estilizado):
 * clic → coordenadas + hitTest con prioridad + highlight + detalle + zoom.
 *
 * Una instancia por vista: al cambiar de vista (2D ↔ 3D) se destruye y se
 * crea otra.
 */
export class MapInteraction {
  private readonly view: ActiveView
  private readonly layers: Layer[]
  private readonly callbacks: MapCallbacks
  private clickHandle: IHandle | null = null
  private highlightHandle: IHandle | null = null
  /** Cada clic incrementa el contador; solo el más reciente aplica su resultado. */
  private latestClick = 0

  constructor(view: ActiveView, layers: readonly Layer[], callbacks: MapCallbacks) {
    this.view = view
    this.layers = [...layers]
    this.callbacks = callbacks
    this.clickHandle = view.on('click', (event) => {
      void this.handleClick(event)
    })
  }

  clearSelection(): void {
    this.highlightHandle?.remove()
    this.highlightHandle = null
  }

  destroy(): void {
    this.latestClick++
    this.clickHandle?.remove()
    this.clickHandle = null
    this.clearSelection()
  }

  private async handleClick(event: __esri.ViewClickEvent): Promise<void> {
    const click = ++this.latestClick
    // Si llegó otro clic (o se destruyó) mientras esperábamos, se descarta.
    const isStale = () => click !== this.latestClick

    event.stopPropagation()
    this.view.closePopup()
    this.callbacks.onCoordinateChange(toCoordinate(event.mapPoint))

    const hit = await this.view.hitTest(event, { include: this.layers })
    if (isStale()) return

    const graphicHit = pickBestGraphicHit(hit.results)
    if (!graphicHit) {
      this.clearSelection()
      this.callbacks.onFeatureSelect(null)
      return
    }

    const layer = graphicHit.layer as QueryableLayer
    const graphic = await resolveGraphicWithAttributes(layer, graphicHit.graphic)
    const layerView = await whenQueryableLayerView(this.view, layer)
    if (isStale()) return

    this.clearSelection()
    this.highlightHandle = layerView.highlight(graphic)
    this.callbacks.onFeatureSelect(toMapFeature(graphic, layer))

    if (graphic.geometry) {
      void this.view.goTo(
        {
          target: graphic.geometry,
          zoom: Math.max(this.view.zoom, FEATURE_ZOOM),
        },
        { duration: 500 },
      )
    }
  }
}

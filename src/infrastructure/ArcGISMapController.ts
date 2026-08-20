import esriConfig from '@arcgis/core/config'
import Basemap from '@arcgis/core/Basemap'
import Map from '@arcgis/core/Map'
import Point from '@arcgis/core/geometry/Point'
import * as projection from '@arcgis/core/geometry/projection'
import SpatialReference from '@arcgis/core/geometry/SpatialReference'
import type Layer from '@arcgis/core/layers/Layer'
import type GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import MapView from '@arcgis/core/views/MapView'
import SceneView from '@arcgis/core/views/SceneView'
import type Expand from '@arcgis/core/widgets/Expand'
import type LayerList from '@arcgis/core/widgets/LayerList'
import type { Coordinate } from '../domain/Coordinate'
import type { IMapService, MapCallbacks } from '../domain/IMapService'
import type { BasemapId, ViewMode } from '../domain/MapControls'
import type { PoiCategory } from '../domain/PoiCategory'
import {
  createOperationalLayers,
  getEntranceCoordinates,
} from './layers'
import { buildPoiCategoryExpression } from './filters/poiCategoryFilter'
import { toMapFeature } from './mappers/mapFeatureMapper'
import {
  clearMapSelection,
  highlightGraphic,
  setupLayerList,
  setupLegend,
  type ActiveView,
} from './widgets/mapWidgets'
import {
  pickBestGraphicHit,
  resolveGraphicWithAttributes,
} from './interaction/hitTestUtils'

const WGS84 = new SpatialReference({ wkid: 4326 })
const MAGNA_SIRGAS_NATIONAL_ORIGIN = new SpatialReference({ wkid: 9377 })
const FEATURE_ZOOM = 17

export class ArcGISMapController implements IMapService {
  private readonly apiKey: string
  private map: Map | null = null
  private mapView: MapView | null = null
  private sceneView: SceneView | null = null
  private view: ActiveView | null = null
  private container: HTMLDivElement | null = null
  private callbacks: MapCallbacks | null = null
  private poiLayer: GeoJSONLayer | null = null
  private clickHandle: IHandle | null = null
  private highlightHandle: IHandle | null = null
  private layerList: LayerList | null = null
  private legendExpand: Expand | null = null
  private interactiveLayers: Layer[] = []
  private viewMode: ViewMode = '2d'
  private destroyed = false

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async initialize(
    container: HTMLDivElement,
    callbacks: MapCallbacks,
  ): Promise<void> {
    if (!this.apiKey.trim()) {
      throw new Error(
        'Falta VITE_ARCGIS_API_KEY. Configúrala en un archivo .env local.',
      )
    }

    esriConfig.apiKey = this.apiKey
    await projection.load()

    if (this.destroyed) {
      return
    }

    const { layers, poiLayer } = createOperationalLayers()
    this.interactiveLayers = layers
    this.poiLayer = poiLayer
    this.container = container
    this.callbacks = callbacks

    const entrance = await getEntranceCoordinates(poiLayer)

    if (this.destroyed) {
      return
    }

    const center: [number, number] = [entrance.longitude, entrance.latitude]

    this.map = new Map({
      basemap: 'topo-vector',
      ground: 'world-elevation',
      layers: this.interactiveLayers,
    })

    this.mapView = new MapView({
      container,
      map: this.map,
      center,
      zoom: 16,
      popupEnabled: false,
    })

    this.sceneView = new SceneView({
      container: null,
      map: this.map,
      center,
      zoom: 16,
      popupEnabled: false,
      qualityProfile: 'low',
    })

    this.view = this.mapView
    await this.mapView.when()

    if (this.destroyed || !this.view) {
      return
    }

    this.bindUi()
    this.bindClick()

    const parkLayer = layers.find((layer) => layer.id === 'parque') as
      | GeoJSONLayer
      | undefined

    if (parkLayer) {
      await parkLayer.when()
      if (!this.destroyed && this.view && parkLayer.fullExtent) {
        void this.view.goTo(parkLayer.fullExtent.expand(1.15), {
          duration: 900,
        })
      }
    }
  }

  setPoiCategoryFilter(categories: readonly PoiCategory[]): void {
    if (!this.poiLayer) {
      return
    }

    this.poiLayer.definitionExpression = buildPoiCategoryExpression(categories)
  }

  setBasemap(basemapId: BasemapId): void {
    if (this.map) {
      this.map.basemap = Basemap.fromId(basemapId)
    }
  }

  async setViewMode(mode: ViewMode): Promise<void> {
    if (
      mode === this.viewMode ||
      !this.mapView ||
      !this.sceneView ||
      !this.container ||
      !this.view
    ) {
      return
    }

    const next = mode === '3d' ? this.sceneView : this.mapView
    const viewpoint = this.view.viewpoint?.clone()

    this.unbindUi()

    this.view.container = null
    next.container = this.container
    if (viewpoint) {
      next.viewpoint = viewpoint
    }

    this.view = next
    this.viewMode = mode

    await next.when()
    if (this.destroyed || !this.view || !this.poiLayer) {
      return
    }

    this.bindUi()
    this.bindClick()

    if (mode === '3d') {
      void this.view.goTo({ tilt: 55 }, { duration: 700 })
    }
  }

  clearSelection(): void {
    if (!this.view) {
      return
    }

    this.highlightHandle = clearMapSelection(this.view, this.highlightHandle)
  }

  destroy(): void {
    this.destroyed = true
    this.unbindUi()

    if (this.mapView) {
      this.mapView.map = null
      this.mapView.destroy()
      this.mapView = null
    }

    if (this.sceneView) {
      this.sceneView.map = null
      this.sceneView.destroy()
      this.sceneView = null
    }

    this.view = null
    this.map?.destroy()
    this.map = null
    this.container = null
    this.callbacks = null
    this.poiLayer = null
    this.interactiveLayers = []
  }

  private bindUi(): void {
    if (!this.view || !this.poiLayer) {
      return
    }

    this.view.closePopup()
    this.layerList = setupLayerList(this.view)
    this.legendExpand = setupLegend(this.view, this.poiLayer)
  }

  private unbindUi(): void {
    this.clickHandle?.remove()
    this.clickHandle = null
    this.highlightHandle?.remove()
    this.highlightHandle = null
    this.layerList?.destroy()
    this.legendExpand?.destroy()
    this.layerList = null
    this.legendExpand = null
  }

  private bindClick(): void {
    if (!this.view || !this.callbacks) {
      return
    }

    this.clickHandle?.remove()
    this.clickHandle = this.view.on('click', (event) => {
      if (this.callbacks) {
        void this.handleMapClick(event, this.callbacks)
      }
    })
  }

  private async handleMapClick(
    event: __esri.ViewClickEvent,
    callbacks: MapCallbacks,
  ): Promise<void> {
    if (!this.view) {
      return
    }

    event.stopPropagation()
    this.view.closePopup()
    callbacks.onCoordinateChange(this.convertCoordinate(event.mapPoint))

    const hit = await this.view.hitTest(event, {
      include: this.interactiveLayers,
    })
    const graphicHit = pickBestGraphicHit(hit.results)

    if (!graphicHit) {
      this.highlightHandle = clearMapSelection(this.view, this.highlightHandle)
      callbacks.onFeatureSelect(null)
      return
    }

    const layer = graphicHit.layer as GeoJSONLayer
    const graphic = await resolveGraphicWithAttributes(
      layer,
      graphicHit.graphic,
    )

    this.highlightHandle = await highlightGraphic(
      this.view,
      layer,
      graphic,
      this.highlightHandle,
    )
    callbacks.onFeatureSelect(toMapFeature(graphic, layer))

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

  private convertCoordinate(mapPoint: Point): Coordinate {
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
}

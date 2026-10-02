import esriConfig from '@arcgis/core/config'
import Basemap from '@arcgis/core/Basemap'
import Map from '@arcgis/core/Map'
import * as projection from '@arcgis/core/geometry/projection'
import type Layer from '@arcgis/core/layers/Layer'
import type GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import MapView from '@arcgis/core/views/MapView'
import SceneView from '@arcgis/core/views/SceneView'
import type Expand from '@arcgis/core/widgets/Expand'
import type LayerList from '@arcgis/core/widgets/LayerList'
import type { IMapService, MapCallbacks } from '../domain/IMapService'
import type { BasemapId, ViewMode } from '../domain/MapControls'
import type { PoiCategory } from '../domain/PoiCategory'
import { PARK_CENTER } from '../domain/Park'
import { createOperationalLayers, setPoiViewMode } from './layers'
import { buildPoiCategoryExpression } from './filters/poiCategoryFilter'
import { MapInteraction } from './interaction/MapInteraction'
import { setupLayerList, setupLegend, type ActiveView } from './widgets/mapWidgets'

export class ArcGISMapController implements IMapService {
  private readonly apiKey: string
  private map: Map | null = null
  private view: ActiveView | null = null
  private container: HTMLDivElement | null = null
  private callbacks: MapCallbacks | null = null
  private poiLayer: GeoJSONLayer | null = null
  private temporary3dLayer: Layer | null = null
  private interaction: MapInteraction | null = null
  private layerList: LayerList | null = null
  private legendExpand: Expand | null = null
  private interactiveLayers: Layer[] = []
  private viewMode: ViewMode = '2d'
  /** Cada cambio 2D/3D incrementa el contador; solo el último termina. */
  private latestViewSwitch = 0
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

    if (this.destroyed) {
      return
    }

    const { layers, poiLayer, temporary3dLayer } = createOperationalLayers()
    this.interactiveLayers = layers
    this.poiLayer = poiLayer
    this.temporary3dLayer = temporary3dLayer
    this.container = container
    this.callbacks = callbacks

    this.map = new Map({
      basemap: 'topo-vector',
      ground: 'world-elevation',
      layers: [...this.interactiveLayers, temporary3dLayer],
    })

    this.view = new MapView({
      container,
      map: this.map,
      // Centro provisional: al cargar la capa del parque se encuadra su extensión.
      center: [PARK_CENTER.longitude, PARK_CENTER.latitude],
      zoom: 16,
      popupEnabled: false,
    })

    await Promise.all([projection.load(), this.view.when()])

    if (this.destroyed || !this.view) {
      return
    }

    this.bindUi()

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
      !this.map ||
      !this.container ||
      !this.view
    ) {
      return
    }

    const current = this.view
    const center = current.center
    const zoom = current.zoom
    const map = this.map

    this.unbindUi()

    // View.destroy() también destruye su Map si sigue asignado.
    // Separamos el Map para conservar todas las capas GeoJSON.
    current.map = null as unknown as Map
    current.destroy()

    if (this.poiLayer) {
      setPoiViewMode(this.poiLayer, mode)
    }
    if (this.temporary3dLayer) {
      this.temporary3dLayer.visible = mode === '3d'
    }

    this.viewMode = mode
    const viewSwitch = ++this.latestViewSwitch
    this.view = mode === '3d'
      ? new SceneView({
          container: this.container,
          map,
          center: [center.longitude, center.latitude],
          zoom,
          popupEnabled: false,
        })
      : new MapView({
          container: this.container,
          map,
          center: [center.longitude, center.latitude],
          zoom,
          popupEnabled: false,
        })

    // Si llegó otro cambio de vista mientras esperábamos, ese termina el trabajo.
    const isStale = () =>
      this.destroyed || viewSwitch !== this.latestViewSwitch || !this.view

    await this.view.when()
    if (isStale() || !this.poiLayer) {
      return
    }

    await Promise.all(this.interactiveLayers.map((layer) => layer.when()))
    if (isStale() || !this.view) {
      return
    }

    this.bindUi()

    if (mode === '3d') {
      void this.view.goTo(
        {
          center: [center.longitude, center.latitude],
          zoom,
          tilt: 55,
          heading: 0,
        },
        { duration: 700 },
      )
    }
  }

  clearSelection(): void {
    this.interaction?.clearSelection()
  }

  destroy(): void {
    this.destroyed = true
    this.unbindUi()

    // destroy() de la vista destruye también su mapa y capas.
    this.view?.destroy()
    this.view = null

    this.map?.destroy()
    this.map = null
    this.container = null
    this.callbacks = null
    this.poiLayer = null
    this.temporary3dLayer = null
    this.interactiveLayers = []
  }

  private bindUi(): void {
    if (!this.view || !this.poiLayer || !this.callbacks) {
      return
    }

    this.view.closePopup()
    this.layerList = setupLayerList(this.view)
    this.legendExpand = setupLegend(this.view, this.poiLayer)
    this.interaction = new MapInteraction(
      this.view,
      this.interactiveLayers,
      this.callbacks,
    )
  }

  private unbindUi(): void {
    this.interaction?.destroy()
    this.interaction = null
    this.layerList?.destroy()
    this.legendExpand?.destroy()
    this.layerList = null
    this.legendExpand = null
  }
}

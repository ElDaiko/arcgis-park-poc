import esriConfig from '@arcgis/core/config'
import Basemap from '@arcgis/core/Basemap'
import Point from '@arcgis/core/geometry/Point'
import * as projection from '@arcgis/core/geometry/projection'
import SpatialReference from '@arcgis/core/geometry/SpatialReference'
import type Layer from '@arcgis/core/layers/Layer'
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import type GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import WebMap from '@arcgis/core/WebMap'
import MapView from '@arcgis/core/views/MapView'
import type Expand from '@arcgis/core/widgets/Expand'
import type LayerList from '@arcgis/core/widgets/LayerList'
import type { Coordinate } from '../domain/Coordinate'
import type { IMapService, MapCallbacks } from '../domain/IMapService'
import type { BasemapId, ViewMode } from '../domain/MapControls'
import type { PoiCategory } from '../domain/PoiCategory'
import { buildPoiCategoryExpression } from './filters/poiCategoryFilter'
import { toMapFeature } from './mappers/mapFeatureMapper'
import {
  clearMapSelection,
  highlightGraphic,
  setupLayerList,
  setupLegend,
} from './widgets/mapWidgets'
import {
  pickBestGraphicHit,
  resolveGraphicWithAttributes,
} from './interaction/hitTestUtils'
import { prepareWebMapLayer } from './webmap/localStyleRenderers'
import { buildWebMapReportData } from './reports/webMapReportData'
import { generateWebMapReport } from './reports/pdfReport'

const WGS84 = new SpatialReference({ wkid: 4326 })
const MAGNA_SIRGAS_NATIONAL_ORIGIN = new SpatialReference({ wkid: 9377 })
const FEATURE_ZOOM = 17

/**
 * Investigación B (avanzada): carga el Web Map alojado en AGOL y reproduce
 * TODA la interactividad del mapa local (hitTest, highlight, panel de detalle,
 * conversión de coordenadas, filtro por categoría, basemap), sobrescribiendo
 * además el estilo de las capas con el renderer local.
 *
 * Implementa el mismo contrato IMapService que ArcGISMapController, por lo que
 * la capa React lo consume igual — solo cambia el origen de las capas
 * (Web Map de AGOL en vez de GeoJSON locales).
 *
 * Nota: se usa MapView (2D). El toggle 3D no aplica a esta investigación.
 */
export class StyledWebMapController implements IMapService {
  private readonly apiKey: string
  private readonly webMapItemId: string
  private webMap: WebMap | null = null
  private view: MapView | null = null
  private callbacks: MapCallbacks | null = null
  private poiLayer: FeatureLayer | null = null
  private trailLayer: FeatureLayer | null = null
  private infrastructureLayer: FeatureLayer | null = null
  private interactiveLayers: Layer[] = []
  private clickHandle: IHandle | null = null
  private highlightHandle: IHandle | null = null
  private layerList: LayerList | null = null
  private legendExpand: Expand | null = null
  private destroyed = false

  constructor(apiKey: string, webMapItemId: string) {
    this.apiKey = apiKey
    this.webMapItemId = webMapItemId
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

    if (!this.webMapItemId.trim()) {
      throw new Error(
        'Falta el item ID del Web Map. Configúralo en VITE_WEBMAP_ITEM_ID.',
      )
    }

    esriConfig.apiKey = this.apiKey

    if (this.destroyed) {
      return
    }

    this.callbacks = callbacks

    this.webMap = new WebMap({
      portalItem: { id: this.webMapItemId },
    })

    this.view = new MapView({
      container,
      map: this.webMap,
      popupEnabled: false,
    })

    await Promise.all([projection.load(), this.view.when()])
    await this.webMap.loadAll()

    if (this.destroyed || !this.view || !this.webMap) {
      return
    }

    // Prepara cada capa del Web Map: estilo local + id canónico + popup off.
    const interactive: Layer[] = []
    this.webMap.layers.forEach((layer) => {
      const canonicalId = prepareWebMapLayer(layer)
      if (canonicalId) {
        interactive.push(layer)
        if (canonicalId === 'pois') {
          this.poiLayer = layer as FeatureLayer
        } else if (canonicalId === 'senderos') {
          this.trailLayer = layer as FeatureLayer
        } else if (canonicalId === 'infraestructura') {
          this.infrastructureLayer = layer as FeatureLayer
        }
      }
    })
    this.interactiveLayers = interactive

    this.bindUi()
    this.bindClick()

    // Encuadra al parque, igual que el mapa local.
    const parkLayer = interactive.find((layer) => layer.id === 'parque')
    if (parkLayer) {
      await parkLayer.when()
      const fullExtent = (parkLayer as FeatureLayer).fullExtent
      if (!this.destroyed && this.view && fullExtent) {
        void this.view.goTo(fullExtent.expand(1.15), { duration: 900 })
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
    if (this.webMap) {
      this.webMap.basemap = Basemap.fromId(basemapId)
    }
  }

  // El toggle 2D/3D no aplica a esta investigación (Web Map en 2D).
  async setViewMode(_mode: ViewMode): Promise<void> {
    return
  }

  clearSelection(): void {
    if (!this.view) {
      return
    }

    this.highlightHandle = clearMapSelection(this.view, this.highlightHandle)
  }

  /**
   * Genera y descarga el informe PDF del Web Map: captura la vista actual,
   * agrega los datos de las capas y compone el PDF.
   */
  async downloadReport(): Promise<void> {
    if (!this.view || this.destroyed) {
      throw new Error('El Web Map no está listo.')
    }

    let mapImage: string | null = null
    try {
      const screenshot = await this.view.takeScreenshot({
        format: 'png',
        quality: 90,
      })
      mapImage = screenshot.dataUrl
    } catch {
      mapImage = null
    }

    const data = await buildWebMapReportData({
      pois: this.poiLayer,
      trails: this.trailLayer,
      infrastructure: this.infrastructureLayer,
    })
    generateWebMapReport(data, mapImage, this.webMapItemId)
  }

  destroy(): void {
    this.destroyed = true
    this.unbindUi()

    if (this.view) {
      this.view.map = null as unknown as WebMap
      this.view.destroy()
      this.view = null
    }

    this.webMap = null
    this.callbacks = null
    this.poiLayer = null
    this.trailLayer = null
    this.infrastructureLayer = null
    this.interactiveLayers = []
  }

  private bindUi(): void {
    if (!this.view || !this.poiLayer) {
      return
    }

    this.view.closePopup()
    this.layerList = setupLayerList(this.view)
    // setupLegend espera GeoJSONLayer; FeatureLayer es compatible para Legend.
    this.legendExpand = setupLegend(
      this.view,
      this.poiLayer as unknown as GeoJSONLayer,
    )
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

import esriConfig from '@arcgis/core/config'
import Basemap from '@arcgis/core/Basemap'
import * as projection from '@arcgis/core/geometry/projection'
import type Layer from '@arcgis/core/layers/Layer'
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import WebMap from '@arcgis/core/WebMap'
import MapView from '@arcgis/core/views/MapView'
import type Expand from '@arcgis/core/widgets/Expand'
import type LayerList from '@arcgis/core/widgets/LayerList'
import type { IMapService, MapCallbacks } from '../domain/IMapService'
import type { BasemapId, ViewMode } from '../domain/MapControls'
import type { PoiCategory } from '../domain/PoiCategory'
import { buildPoiCategoryExpression } from './filters/poiCategoryFilter'
import { MapInteraction } from './interaction/MapInteraction'
import { setupLayerList, setupLegend } from './widgets/mapWidgets'
import { prepareWebMapLayer } from './webmap/webMapLayers'
import { buildWebMapReportData } from './reports/webMapReportData'

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
  private interaction: MapInteraction | null = null
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
    this.interaction?.clearSelection()
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
    // jsPDF + autotable (~400 kB) se cargan solo al pedir el informe.
    const { generateWebMapReport } = await import('./reports/pdfReport')
    generateWebMapReport(data, mapImage, this.webMapItemId)
  }

  destroy(): void {
    this.destroyed = true
    this.unbindUi()

    // destroy() de la vista destruye también su mapa y capas.
    this.view?.destroy()
    this.view = null

    this.webMap?.destroy()
    this.webMap = null
    this.callbacks = null
    this.poiLayer = null
    this.trailLayer = null
    this.infrastructureLayer = null
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

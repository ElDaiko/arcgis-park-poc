import esriConfig from '@arcgis/core/config'
import WebMap from '@arcgis/core/WebMap'
import MapView from '@arcgis/core/views/MapView'
import LayerList from '@arcgis/core/widgets/LayerList'
import Legend from '@arcgis/core/widgets/Legend'
import Expand from '@arcgis/core/widgets/Expand'

/**
 * Callbacks que el WebMapController usa para comunicar estado a React.
 * React NO importa @arcgis/core: recibe datos planos vía estas funciones.
 */
export interface WebMapCallbacks {
  onReady: (info: WebMapInfo) => void
  onError: (message: string) => void
}

/** Metadatos planos del Web Map, seguros para pasar a React. */
export interface WebMapInfo {
  title: string
  layerTitles: string[]
}

/**
 * Investigación B: el mapa (capas + estilos + popups + basemap + extent) vive
 * en ArcGIS Online como un Web Map. El front solo necesita el item ID.
 *
 * Este controller demuestra que, aun cargando la configuración desde AGOL,
 * el front conserva control total: puede leer capas, sobrescribir renderers,
 * cambiar popups, filtrar, etc. en tiempo de ejecución.
 */
export class WebMapController {
  private readonly apiKey: string
  private readonly webMapItemId: string
  private webMap: WebMap | null = null
  private view: MapView | null = null
  private layerListExpand: Expand | null = null
  private legendExpand: Expand | null = null
  private destroyed = false

  constructor(apiKey: string, webMapItemId: string) {
    this.apiKey = apiKey
    this.webMapItemId = webMapItemId
  }

  async initialize(
    container: HTMLDivElement,
    callbacks: WebMapCallbacks,
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

    // 1. El Web Map se carga por su item ID desde AGOL.
    //    Trae capas, estilos, popups, basemap y extent ya configurados.
    this.webMap = new WebMap({
      portalItem: { id: this.webMapItemId },
    })

    this.view = new MapView({
      container,
      map: this.webMap,
      // No fijamos center/zoom: respetamos el extent guardado en el Web Map.
    })

    try {
      await this.view.when()
      // Espera a que las capas del Web Map estén cargadas para leerlas.
      await this.webMap.loadAll()
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : 'No fue posible cargar el Web Map desde ArcGIS Online.'
      callbacks.onError(message)
      return
    }

    if (this.destroyed || !this.view) {
      return
    }

    // 2. Widgets del front (no dependen del Web Map, los agregamos aquí).
    this.setupWidgets()

    // 3. Reportamos a React qué trajo el Web Map (demuestra introspección).
    const layerTitles = this.webMap.layers
      .toArray()
      .map((layer) => layer.title ?? layer.id)

    callbacks.onReady({
      title: this.webMap.portalItem?.title ?? 'Web Map',
      layerTitles,
    })
  }

  private setupWidgets(): void {
    if (!this.view) {
      return
    }

    const layerList = new LayerList({ view: this.view })
    this.layerListExpand = new Expand({
      view: this.view,
      content: layerList,
      expanded: true,
    })
    this.view.ui.add(this.layerListExpand, 'top-left')

    const legend = new Legend({ view: this.view })
    this.legendExpand = new Expand({
      view: this.view,
      content: legend,
    })
    this.view.ui.add(this.legendExpand, 'bottom-right')
  }

  destroy(): void {
    this.destroyed = true
    this.layerListExpand?.destroy()
    this.legendExpand?.destroy()
    this.layerListExpand = null
    this.legendExpand = null

    if (this.view) {
      this.view.map = null as unknown as WebMap
      this.view.destroy()
      this.view = null
    }

    this.webMap = null
  }
}

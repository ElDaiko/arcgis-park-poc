import esriConfig from '@arcgis/core/config'
import Map from '@arcgis/core/Map'
import Point from '@arcgis/core/geometry/Point'
import * as projection from '@arcgis/core/geometry/projection'
import SpatialReference from '@arcgis/core/geometry/SpatialReference'
import type Layer from '@arcgis/core/layers/Layer'
import type GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import MapView from '@arcgis/core/views/MapView'
import type { Coordinate } from '../domain/Coordinate'
import type { IMapService, MapCallbacks } from '../domain/IMapService'
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
} from './widgets/mapWidgets'
import {
  pickBestGraphicHit,
  resolveGraphicWithAttributes,
} from './interaction/hitTestUtils'

const WGS84 = new SpatialReference({ wkid: 4326 })
const MAGNA_SIRGAS_NATIONAL_ORIGIN = new SpatialReference({ wkid: 9377 })

export class ArcGISMapController implements IMapService {
  private readonly apiKey: string
  private view: MapView | null = null
  private poiLayer: GeoJSONLayer | null = null
  private clickHandle: IHandle | null = null
  private highlightHandle: IHandle | null = null
  private interactiveLayers: Layer[] = []
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
    const entrance = await getEntranceCoordinates(poiLayer)

    if (this.destroyed) {
      return
    }

    const map = new Map({
      basemap: 'topo-vector',
      layers: this.interactiveLayers,
    })

    this.view = new MapView({
      container,
      map,
      center: [entrance.longitude, entrance.latitude],
      zoom: 16,
      popupEnabled: false,
    })

    await this.view.when()

    if (this.destroyed || !this.view) {
      return
    }

    this.view.closePopup()

    setupLayerList(this.view)
    setupLegend(this.view, poiLayer)

    const parkLayer = layers.find((layer) => layer.id === 'parque') as
      | __esri.GeoJSONLayer
      | undefined

    if (parkLayer) {
      await parkLayer.when()
      if (!this.destroyed && this.view && parkLayer.fullExtent) {
        void this.view.goTo(parkLayer.fullExtent.expand(1.15), {
          duration: 900,
        })
      }
    }

    this.clickHandle = this.view.on('click', (event) => {
      void this.handleMapClick(event, callbacks)
    })
  }

  setPoiCategoryFilter(categories: readonly PoiCategory[]): void {
    if (!this.poiLayer) {
      return
    }

    this.poiLayer.definitionExpression = buildPoiCategoryExpression(categories)
  }

  clearSelection(): void {
    if (!this.view) {
      return
    }

    this.highlightHandle = clearMapSelection(this.view, this.highlightHandle)
  }

  destroy(): void {
    this.destroyed = true
    this.clickHandle?.remove()
    this.clickHandle = null
    this.highlightHandle?.remove()
    this.highlightHandle = null
    this.view?.destroy()
    this.view = null
    this.poiLayer = null
    this.interactiveLayers = []
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

    const layer = graphicHit.layer as __esri.GeoJSONLayer
    const graphic = await resolveGraphicWithAttributes(layer, graphicHit.graphic)

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
          zoom: Math.max(this.view.zoom, 18),
        },
        { duration: 600 },
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

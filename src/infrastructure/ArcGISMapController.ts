import esriConfig from '@arcgis/core/config'
import Map from '@arcgis/core/Map'
import Point from '@arcgis/core/geometry/Point'
import * as projection from '@arcgis/core/geometry/projection'
import SpatialReference from '@arcgis/core/geometry/SpatialReference'
import MapView from '@arcgis/core/views/MapView'
import type { Coordinate } from '../domain/Coordinate'
import type {
  CoordinateChangeHandler,
  IMapService,
} from '../domain/IMapService'
import {
  createParkBoundaryLayer,
  createPoiLayer,
  getEntranceCoordinates,
} from './parkGeoJsonLayers'

const WGS84 = new SpatialReference({ wkid: 4326 })
const MAGNA_SIRGAS_NATIONAL_ORIGIN = new SpatialReference({ wkid: 9377 })

export class ArcGISMapController implements IMapService {
  private readonly apiKey: string
  private view: MapView | null = null
  private clickHandle: IHandle | null = null
  private destroyed = false

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async initialize(
    container: HTMLDivElement,
    onCoordinateChange: CoordinateChangeHandler,
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

    const parkLayer = createParkBoundaryLayer()
    const poiLayer = createPoiLayer()
    const entrance = await getEntranceCoordinates(poiLayer)

    if (this.destroyed) {
      return
    }

    const map = new Map({
      basemap: 'topo-vector',
      layers: [parkLayer, poiLayer],
    })

    this.view = new MapView({
      container,
      map,
      center: [entrance.longitude, entrance.latitude],
      zoom: 17,
    })

    await this.view.when()

    if (this.destroyed || !this.view) {
      return
    }

    this.clickHandle = this.view.on('click', (event) => {
      const coordinate = this.convertCoordinate(event.mapPoint)
      onCoordinateChange(coordinate)
    })
  }

  destroy(): void {
    this.destroyed = true
    this.clickHandle?.remove()
    this.clickHandle = null
    this.view?.destroy()
    this.view = null
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

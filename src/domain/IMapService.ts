import type { Coordinate } from './Coordinate'
import type { MapFeature } from './MapFeature'
import type { PoiCategory } from './PoiCategory'

export type CoordinateChangeHandler = (coordinate: Coordinate) => void
export type FeatureSelectHandler = (feature: MapFeature | null) => void

export interface MapCallbacks {
  onCoordinateChange: CoordinateChangeHandler
  onFeatureSelect: FeatureSelectHandler
}

export interface IMapService {
  initialize(container: HTMLDivElement, callbacks: MapCallbacks): Promise<void>
  /** Filtra POIs por categorías visibles. Array vacío = ocultar todos. */
  setPoiCategoryFilter(categories: readonly PoiCategory[]): void
  /** Quita highlight y cierra la selección en el mapa. */
  clearSelection(): void
  destroy(): void
}

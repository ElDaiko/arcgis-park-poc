import type { Coordinate } from './Coordinate'
import type { BasemapId, ViewMode } from './MapControls'
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
  setPoiCategoryFilter(categories: readonly PoiCategory[]): void
  setBasemap(basemapId: BasemapId): void
  setViewMode(mode: ViewMode): Promise<void>
  clearSelection(): void
  destroy(): void
}

import type { Coordinate } from './Coordinate'
import type { MapFeature } from './MapFeature'

export type CoordinateChangeHandler = (coordinate: Coordinate) => void
export type FeatureSelectHandler = (feature: MapFeature | null) => void

export interface MapCallbacks {
  onCoordinateChange: CoordinateChangeHandler
  onFeatureSelect: FeatureSelectHandler
}

export interface IMapService {
  initialize(container: HTMLDivElement, callbacks: MapCallbacks): Promise<void>
  destroy(): void
}

import type { Coordinate } from './Coordinate'

export type CoordinateChangeHandler = (coordinate: Coordinate) => void

export interface IMapService {
  initialize(
    container: HTMLDivElement,
    onCoordinateChange: CoordinateChangeHandler,
  ): Promise<void>
  destroy(): void
}

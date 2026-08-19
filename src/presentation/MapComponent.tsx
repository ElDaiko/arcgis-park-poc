import { useEffect, useRef, useState } from 'react'
import type { Coordinate } from '../domain/Coordinate'
import type { IMapService } from '../domain/IMapService'
import { ArcGISMapController } from '../infrastructure/ArcGISMapController'
import { CoordinatePanel } from './CoordinatePanel'

export function MapComponent() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const container = mapContainerRef.current

    if (!container) {
      return
    }

    const mapService: IMapService = new ArcGISMapController(
      import.meta.env.VITE_ARCGIS_API_KEY ?? '',
    )

    void mapService.initialize(container, setCoordinate).catch((reason) => {
      const message =
        reason instanceof Error ? reason.message : 'No fue posible cargar el mapa.'
      setError(message)
    })

    return () => {
      mapService.destroy()
    }
  }, [])

  return (
    <main className="map-shell">
      <div
        ref={mapContainerRef}
        className="map-container"
        aria-label="Mapa de la entrada al Parque Tutucán"
      />
      <CoordinatePanel coordinate={coordinate} />
      {error && (
        <div className="map-error" role="alert">
          <strong>Error al inicializar el mapa</strong>
          <span>{error}</span>
        </div>
      )}
      <div className="map-place-label" aria-hidden="true">
        <span>PoC GIS</span>
        <strong>Entrada Parque Tutucán</strong>
      </div>
    </main>
  )
}

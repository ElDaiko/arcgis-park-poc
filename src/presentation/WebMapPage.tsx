import { useEffect, useRef, useState } from 'react'
import {
  WebMapController,
  type WebMapInfo,
} from '../infrastructure/WebMapController'

/**
 * Investigación B — Web Map alojado en ArcGIS Online.
 *
 * Toda la configuración del mapa (capas, estilos, popups, basemap, extent)
 * vive en AGOL. El front solo aporta el item ID y los widgets/UI.
 */
export function WebMapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<WebMapController | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [info, setInfo] = useState<WebMapInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    const controller = new WebMapController(
      import.meta.env.VITE_ARCGIS_API_KEY ?? '',
      import.meta.env.VITE_WEBMAP_ITEM_ID ?? '',
    )
    controllerRef.current = controller

    void controller
      .initialize(container, {
        onReady: (webMapInfo) => {
          setInfo(webMapInfo)
          setIsLoading(false)
        },
        onError: (message) => {
          setError(message)
          setIsLoading(false)
        },
      })
      .catch((reason: unknown) => {
        const message =
          reason instanceof Error
            ? reason.message
            : 'No fue posible cargar el Web Map.'
        setError(message)
        setIsLoading(false)
      })

    return () => {
      controllerRef.current?.destroy()
      controllerRef.current = null
    }
  }, [])

  return (
    <main className="map-shell">
      <div
        ref={mapContainerRef}
        className="map-container"
        aria-label="Web Map del Parque Tutucán alojado en ArcGIS Online"
      />

      <section className="density-controls" aria-label="Información del Web Map">
        <h2 className="density-controls__title">Web Map (AGOL)</h2>
        <p className="density-controls__subtitle">
          Investigación B · configuración alojada en ArcGIS Online
        </p>

        {info && (
          <div className="density-controls__legend-note">
            <p>
              <strong>{info.title}</strong>
            </p>
            <p>
              {info.layerTitles.length} capa(s) cargadas desde AGOL:
            </p>
            <ul>
              {info.layerTitles.map((title) => (
                <li key={title}>{title}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {isLoading && (
        <div className="map-loading" role="status" aria-live="polite">
          <span className="map-loading__spinner" aria-hidden="true" />
          <span>Cargando Web Map desde ArcGIS Online…</span>
        </div>
      )}

      {error && (
        <div className="map-error" role="alert">
          <strong>Error al cargar el Web Map</strong>
          <span>{error}</span>
        </div>
      )}
    </main>
  )
}

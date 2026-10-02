import { useEffect, useRef, useState } from 'react'
import {
  WebMapController,
  type WebMapInfo,
} from '../infrastructure/WebMapController'
import { appConfig } from '../config'
import { errorMessage } from './errorMessage'
import { MapShell } from './MapShell'
import { MapError, MapLoading } from './MapStatus'
import { SidePanel } from './SidePanel'
import styles from './WebMapPage.module.scss'

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
      appConfig.arcgisApiKey,
      appConfig.webMapItemId,
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
        setError(errorMessage(reason, 'No fue posible cargar el Web Map.'))
        setIsLoading(false)
      })

    return () => {
      controllerRef.current?.destroy()
      controllerRef.current = null
    }
  }, [])

  return (
    <MapShell
      mapRef={mapContainerRef}
      mapLabel="Web Map del Parque Tutucán alojado en ArcGIS Online"
      topRight={
        <SidePanel
          eyebrow="Investigación B · ArcGIS Online"
          title="Web Map (AGOL)"
          ariaLabel="Información del Web Map"
        >
          <p className={styles.note}>
            Capas, estilos, popups, mapa base y extensión vienen del Web Map
            alojado. El front solo aporta el item ID.
          </p>
          {info && (
            <div className={styles.layers}>
              <span className={styles.layersTitle}>
                {info.title} · {info.layerTitles.length} capa(s)
              </span>
              <ul className={styles.layerList}>
                {info.layerTitles.map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
            </div>
          )}
        </SidePanel>
      }
    >
      {isLoading && <MapLoading message="Cargando Web Map desde ArcGIS Online…" />}
      {error && <MapError title="Error al cargar el Web Map" message={error} />}
    </MapShell>
  )
}

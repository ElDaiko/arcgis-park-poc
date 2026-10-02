import { useEffect, useRef, useState } from 'react'
import {
  DensityMapController,
  type DensityField,
} from '../infrastructure/density/DensityMapController'
import { appConfig } from '../config'
import styles from './DensityMapPage.module.scss'
import { errorMessage } from './errorMessage'
import { MapShell } from './MapShell'
import { MapError, MapLoading } from './MapStatus'
import { ReportDownloadButton } from './ReportDownloadButton'
import { SidePanel } from './SidePanel'

const FIELD_OPTIONS: { value: DensityField; label: string; description: string }[] = [
  {
    value: 'indice_densidad',
    label: 'Índice de densidad',
    description: 'Proporción normalizada de ocupación por celda (0.0 – 1.0)',
  },
  {
    value: 'aforo_actual',
    label: 'Aforo actual',
    description: 'Personas presentes en cada celda de grilla (0 – 350)',
  },
]

export function DensityMapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<DensityMapController | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRendering, setIsRendering] = useState(false)
  const [activeField, setActiveField] = useState<DensityField>('indice_densidad')
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    const start = () => {
      const controller = new DensityMapController(
        appConfig.arcgisApiKey,
      )
      controllerRef.current = controller
      void controller
        .initialize(container, {
          onReady: () => setIsLoading(false),
          onError: (message) => {
            setError(message)
            setIsLoading(false)
          },
          onRendererApplied: (field) => setActiveField(field),
        })
        .catch((reason: unknown) => {
          setError(errorMessage(reason, 'No fue posible cargar el mapa de densidad.'))
          setIsLoading(false)
        })
    }

    // Defer initialization by one animation frame so the container is
    // guaranteed to have real layout dimensions (not display:none).
    // If it is still hidden, try once more on the next frame.
    let rafId = requestAnimationFrame(() => {
      if (container.offsetWidth === 0) {
        rafId = requestAnimationFrame(start)
        return
      }
      start()
    })

    return () => {
      cancelAnimationFrame(rafId)
      controllerRef.current?.destroy()
      controllerRef.current = null
    }
  }, [])

  const handleFieldChange = async (field: DensityField) => {
    if (field === activeField || isRendering || !controllerRef.current) return

    setIsRendering(true)
    try {
      await controllerRef.current.switchField(field)
      setActiveField(field)
    } finally {
      setIsRendering(false)
    }
  }

  const activeFieldMeta = FIELD_OPTIONS.find((f) => f.value === activeField)

  const handleDownloadReport = async () => {
    if (isDownloading || !controllerRef.current) return
    setIsDownloading(true)
    try {
      await controllerRef.current.downloadReport()
    } catch (reason) {
      setError(errorMessage(reason, 'No fue posible generar el informe.'))
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <MapShell
      mapRef={mapContainerRef}
      mapLabel="Mapa de análisis de densidad del parque"
      topRight={
        <SidePanel
          eyebrow="Extrusión 3D por grilla"
          title="Análisis de densidad"
          ariaLabel="Controles de densidad"
        >
          <div
            className={styles.fields}
            role="group"
            aria-label="Campo de visualización"
          >
            {FIELD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  option.value === activeField
                    ? `${styles.fieldButton} ${styles.isActive}`
                    : styles.fieldButton
                }
                aria-pressed={option.value === activeField}
                disabled={isRendering || isLoading}
                onClick={() => void handleFieldChange(option.value)}
              >
                <span className={styles.fieldName}>{option.label}</span>
                <span className={styles.fieldDesc}>{option.description}</span>
              </button>
            ))}
          </div>

          {isRendering && (
            <p className={styles.status} role="status" aria-live="polite">
              Actualizando extrusión 3D…
            </p>
          )}

          {activeFieldMeta && !isRendering && !isLoading && (
            <p className={styles.activeField} aria-live="polite">
              Visualizando: <strong>{activeFieldMeta.label}</strong>
            </p>
          )}

          <p className={styles.note}>
            Cada celda de grilla se extruda verticalmente según el campo
            seleccionado. La rampa de color refuerza la lectura: tonos claros
            indican baja densidad y tonos oscuros/intensos indican alta densidad.
          </p>

          <ReportDownloadButton
            isDownloading={isDownloading}
            disabled={isLoading}
            onClick={() => void handleDownloadReport()}
          />
        </SidePanel>
      }
    >
      {isLoading && <MapLoading message="Cargando mapa 3D de densidad…" />}
      {error && <MapError title="Error al inicializar el mapa" message={error} />}
    </MapShell>
  )
}

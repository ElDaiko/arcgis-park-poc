import { useEffect, useRef, useState } from 'react'
import {
  DensityMapController,
  type DensityField,
} from '../infrastructure/density/DensityMapController'

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

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    let rafId: number
    let controller: DensityMapController

    // Defer initialization by one animation frame so the container is
    // guaranteed to have real layout dimensions (not display:none).
    rafId = requestAnimationFrame(() => {
      if (container.offsetWidth === 0) {
        // Still hidden — try again next frame
        rafId = requestAnimationFrame(() => {
          controller = new DensityMapController(
            import.meta.env.VITE_ARCGIS_API_KEY ?? '',
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
              const message =
                reason instanceof Error
                  ? reason.message
                  : 'No fue posible cargar el mapa de densidad.'
              setError(message)
              setIsLoading(false)
            })
        })
        return
      }

      controller = new DensityMapController(
        import.meta.env.VITE_ARCGIS_API_KEY ?? '',
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
          const message =
            reason instanceof Error
              ? reason.message
              : 'No fue posible cargar el mapa de densidad.'
          setError(message)
          setIsLoading(false)
        })
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

  return (
    <main className="map-shell">
      <div
        ref={mapContainerRef}
        className="map-container"
        aria-label="Mapa de análisis de densidad del parque"
      />

      <section className="density-controls" aria-label="Controles de densidad">
        <h2 className="density-controls__title">Análisis de densidad</h2>
        <p className="density-controls__subtitle">
          Extrusión 3D por grilla · SceneView
        </p>

        <div className="density-controls__fields" role="group" aria-label="Campo de visualización">
          {FIELD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                option.value === activeField
                  ? 'density-controls__field-btn is-active'
                  : 'density-controls__field-btn'
              }
              aria-pressed={option.value === activeField}
              disabled={isRendering || isLoading}
              onClick={() => void handleFieldChange(option.value)}
            >
              <span className="density-controls__field-name">{option.label}</span>
              <span className="density-controls__field-desc">{option.description}</span>
            </button>
          ))}
        </div>

        {isRendering && (
          <p className="density-controls__status" role="status" aria-live="polite">
            Actualizando extrusión 3D…
          </p>
        )}

        {activeFieldMeta && !isRendering && !isLoading && (
          <p className="density-controls__active-field" aria-live="polite">
            Visualizando: <strong>{activeFieldMeta.label}</strong>
          </p>
        )}

        <div className="density-controls__legend-note">
          <p>
            Cada celda de grilla se extruda verticalmente según el campo
            seleccionado. La rampa de color refuerza la lectura: tonos claros
            indican baja densidad y tonos oscuros/intensos indican alta densidad.
          </p>
        </div>
      </section>

      {isLoading && (
        <div className="map-loading" role="status" aria-live="polite">
          <span className="map-loading__spinner" aria-hidden="true" />
          <span>Cargando mapa 3D de densidad…</span>
        </div>
      )}

      {error && (
        <div className="map-error" role="alert">
          <strong>Error al inicializar el mapa</strong>
          <span>{error}</span>
        </div>
      )}
    </main>
  )
}

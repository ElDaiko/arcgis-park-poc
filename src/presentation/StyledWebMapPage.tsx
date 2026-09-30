import { useEffect, useRef, useState } from 'react'
import type { Coordinate } from '../domain/Coordinate'
import type { MapFeature } from '../domain/MapFeature'
import type { IMapService } from '../domain/IMapService'
import type { BasemapId, ViewMode } from '../domain/MapControls'
import { DEFAULT_BASEMAP, DEFAULT_VIEW_MODE } from '../domain/MapControls'
import type { PoiCategory } from '../domain/PoiCategory'
import { POI_CATEGORIES } from '../domain/PoiCategory'
import { StyledWebMapController } from '../infrastructure/StyledWebMapController'
import { CategoryFilterPanel } from './CategoryFilterPanel'
import { CoordinatePanel } from './CoordinatePanel'
import { FeatureDetailPanel } from './FeatureDetailPanel'
import { MapControlsPanel } from './MapControlsPanel'

/**
 * Investigación B (avanzada) — mismo Web Map de AGOL que la pestaña
 * "Web Map (AGOL)", pero con el estilo local aplicado y TODA la
 * interactividad del mapa del parque (hitTest, detalle, coordenadas, filtro).
 *
 * Usa el mismo contrato IMapService que MapComponent: solo cambia la
 * implementación concreta (StyledWebMapController en vez de ArcGISMapController).
 */
export function StyledWebMapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapServiceRef = useRef<IMapService | null>(null)
  const controllerRef = useRef<StyledWebMapController | null>(null)
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null)
  const [selectedFeature, setSelectedFeature] = useState<MapFeature | null>(null)
  const [activeCategories, setActiveCategories] = useState<PoiCategory[]>([
    ...POI_CATEGORIES,
  ])
  const [basemapId, setBasemapId] = useState<BasemapId>(DEFAULT_BASEMAP)
  const [viewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    const mapService = new StyledWebMapController(
      import.meta.env.VITE_ARCGIS_API_KEY ?? '',
      import.meta.env.VITE_WEBMAP_ITEM_ID ?? '',
    )
    mapServiceRef.current = mapService
    controllerRef.current = mapService

    void mapService
      .initialize(container, {
        onCoordinateChange: setCoordinate,
        onFeatureSelect: setSelectedFeature,
      })
      .then(() => setIsReady(true))
      .catch((reason: unknown) => {
        const message =
          reason instanceof Error
            ? reason.message
            : 'No fue posible cargar el Web Map estilizado.'
        setError(message)
      })

    return () => {
      mapService.destroy()
      mapServiceRef.current = null
      controllerRef.current = null
    }
  }, [])

  const handleDownloadReport = async () => {
    if (isDownloading || !controllerRef.current) return
    setIsDownloading(true)
    try {
      await controllerRef.current.downloadReport()
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : 'No fue posible generar el informe.'
      setError(message)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCategoryChange = (categories: PoiCategory[]) => {
    setActiveCategories(categories)
    mapServiceRef.current?.setPoiCategoryFilter(categories)

    if (
      selectedFeature?.category &&
      !categories.includes(selectedFeature.category as PoiCategory)
    ) {
      setSelectedFeature(null)
      mapServiceRef.current?.clearSelection()
    }
  }

  const handleCloseFeature = () => {
    setSelectedFeature(null)
    mapServiceRef.current?.clearSelection()
  }

  return (
    <main className="map-shell">
      <div
        ref={mapContainerRef}
        className="map-container"
        aria-label="Web Map de AGOL con estilo e interactividad locales"
      />
      <CategoryFilterPanel
        selected={activeCategories}
        onChange={handleCategoryChange}
      />
      <MapControlsPanel
        basemapId={basemapId}
        viewMode={viewMode}
        onBasemapChange={(id) => {
          setBasemapId(id)
          mapServiceRef.current?.setBasemap(id)
        }}
        onViewModeChange={() => {
          // El toggle 2D/3D no aplica al Web Map de esta investigación.
        }}
      />
      <CoordinatePanel coordinate={coordinate} />
      <button
        type="button"
        className="report-download-btn report-download-btn--floating"
        onClick={() => void handleDownloadReport()}
        disabled={isDownloading || !isReady}
      >
        {isDownloading ? 'Generando informe…' : '⬇ Descargar informe PDF'}
      </button>
      {selectedFeature && (
        <FeatureDetailPanel
          feature={selectedFeature}
          onClose={handleCloseFeature}
        />
      )}
      {error && (
        <div className="map-error" role="alert">
          <strong>Error al cargar el Web Map estilizado</strong>
          <span>{error}</span>
        </div>
      )}
    </main>
  )
}

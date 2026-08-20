import { useEffect, useRef, useState } from 'react'
import type { Coordinate } from '../domain/Coordinate'
import type { MapFeature } from '../domain/MapFeature'
import type { IMapService } from '../domain/IMapService'
import type { BasemapId, ViewMode } from '../domain/MapControls'
import {
  DEFAULT_BASEMAP,
  DEFAULT_VIEW_MODE,
} from '../domain/MapControls'
import type { PoiCategory } from '../domain/PoiCategory'
import { POI_CATEGORIES } from '../domain/PoiCategory'
import { ArcGISMapController } from '../infrastructure/ArcGISMapController'
import { CategoryFilterPanel } from './CategoryFilterPanel'
import { CoordinatePanel } from './CoordinatePanel'
import { FeatureDetailPanel } from './FeatureDetailPanel'
import { MapControlsPanel } from './MapControlsPanel'

export function MapComponent() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapServiceRef = useRef<IMapService | null>(null)
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null)
  const [selectedFeature, setSelectedFeature] = useState<MapFeature | null>(null)
  const [activeCategories, setActiveCategories] = useState<PoiCategory[]>([
    ...POI_CATEGORIES,
  ])
  const [basemapId, setBasemapId] = useState<BasemapId>(DEFAULT_BASEMAP)
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const container = mapContainerRef.current

    if (!container) {
      return
    }

    const mapService: IMapService = new ArcGISMapController(
      import.meta.env.VITE_ARCGIS_API_KEY ?? '',
    )
    mapServiceRef.current = mapService

    void mapService
      .initialize(container, {
        onCoordinateChange: setCoordinate,
        onFeatureSelect: setSelectedFeature,
      })
      .catch((reason) => {
        const message =
          reason instanceof Error
            ? reason.message
            : 'No fue posible cargar el mapa.'
        setError(message)
      })

    return () => {
      mapService.destroy()
      mapServiceRef.current = null
    }
  }, [])

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
        aria-label="Mapa de la entrada al Parque Tutucán"
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
        onViewModeChange={(mode) => {
          setViewMode(mode)
          void mapServiceRef.current?.setViewMode(mode)
        }}
      />
      <CoordinatePanel coordinate={coordinate} />
      {selectedFeature && (
        <FeatureDetailPanel
          feature={selectedFeature}
          onClose={handleCloseFeature}
        />
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

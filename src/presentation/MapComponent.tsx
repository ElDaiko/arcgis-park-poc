import { useState } from 'react'
import { DEFAULT_VIEW_MODE, type ViewMode } from '../domain/MapControls'
import { ArcGISMapController } from '../infrastructure/ArcGISMapController'
import { appConfig } from '../config'
import { CategoryFilterPanel } from './CategoryFilterPanel'
import { CoordinatePanel } from './CoordinatePanel'
import { FeatureDetailPanel } from './FeatureDetailPanel'
import { MapControlsPanel } from './MapControlsPanel'
import { MapShell } from './MapShell'
import { MapError } from './MapStatus'
import { useMapService } from './useMapService'

/** Pestaña "Mapa del Parque": capas GeoJSON locales, estilo 100 % en código. */
export function MapComponent() {
  const map = useMapService(
    () => new ArcGISMapController(appConfig.arcgisApiKey),
    'No fue posible cargar el mapa.',
  )
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE)

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode)
    void map.serviceRef.current?.setViewMode(mode)
  }

  return (
    <MapShell
      mapRef={map.mapRef}
      mapLabel="Mapa de la entrada al Parque Tutucán"
      topLeft={
        <CategoryFilterPanel
          selected={map.activeCategories}
          onChange={map.changeCategories}
        />
      }
      topCenter={
        <MapControlsPanel
          basemapId={map.basemapId}
          viewMode={viewMode}
          onBasemapChange={map.changeBasemap}
          onViewModeChange={changeViewMode}
        />
      }
      topRight={<CoordinatePanel coordinate={map.coordinate} />}
      bottomRight={
        map.selectedFeature && (
          <FeatureDetailPanel
            feature={map.selectedFeature}
            onClose={map.clearSelection}
          />
        )
      }
    >
      {map.error && (
        <MapError title="Error al inicializar el mapa" message={map.error} />
      )}
    </MapShell>
  )
}

import { useState } from 'react'
import { DEFAULT_VIEW_MODE } from '../domain/MapControls'
import { StyledWebMapController } from '../infrastructure/StyledWebMapController'
import { appConfig } from '../config'
import { CategoryFilterPanel } from './CategoryFilterPanel'
import { CoordinatePanel } from './CoordinatePanel'
import { errorMessage } from './errorMessage'
import { FeatureDetailPanel } from './FeatureDetailPanel'
import { MapControlsPanel } from './MapControlsPanel'
import { MapShell } from './MapShell'
import { MapError } from './MapStatus'
import { ReportDownloadButton } from './ReportDownloadButton'
import { useMapService } from './useMapService'

/**
 * Investigación B (avanzada) — mismo Web Map de AGOL que la pestaña
 * "Web Map (AGOL)", pero con el estilo local aplicado y TODA la
 * interactividad del mapa del parque (hitTest, detalle, coordenadas, filtro).
 *
 * Usa el mismo hook y contrato IMapService que MapComponent: solo cambia la
 * implementación concreta (StyledWebMapController en vez de ArcGISMapController).
 */
export function StyledWebMapPage() {
  const map = useMapService(
    () =>
      new StyledWebMapController(appConfig.arcgisApiKey, appConfig.webMapItemId),
    'No fue posible cargar el Web Map estilizado.',
  )
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadReport = async () => {
    const controller = map.serviceRef.current
    if (isDownloading || !controller) return
    setIsDownloading(true)
    try {
      await controller.downloadReport()
    } catch (reason) {
      map.setError(errorMessage(reason, 'No fue posible generar el informe.'))
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <MapShell
      mapRef={map.mapRef}
      mapLabel="Web Map de AGOL con estilo e interactividad locales"
      topLeft={
        <CategoryFilterPanel
          selected={map.activeCategories}
          onChange={map.changeCategories}
        />
      }
      topCenter={
        // Sin onViewModeChange: el Web Map de esta investigación es solo 2D.
        <MapControlsPanel
          basemapId={map.basemapId}
          viewMode={DEFAULT_VIEW_MODE}
          onBasemapChange={map.changeBasemap}
        />
      }
      topRight={
        <>
          <CoordinatePanel coordinate={map.coordinate} />
          <ReportDownloadButton
            isDownloading={isDownloading}
            disabled={!map.isReady}
            onClick={() => void handleDownloadReport()}
          />
        </>
      }
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
        <MapError
          title="Error al cargar el Web Map estilizado"
          message={map.error}
        />
      )}
    </MapShell>
  )
}

import {
  BASEMAP_OPTIONS,
  type BasemapId,
  type ViewMode,
} from '../domain/MapControls'

interface MapControlsPanelProps {
  basemapId: BasemapId
  viewMode: ViewMode
  onBasemapChange: (id: BasemapId) => void
  onViewModeChange: (mode: ViewMode) => void
}

export function MapControlsPanel({
  basemapId,
  viewMode,
  onBasemapChange,
  onViewModeChange,
}: MapControlsPanelProps) {
  return (
    <aside className="map-controls" aria-label="Controles del mapa">
      <label className="map-controls__field">
        <span>Mapa</span>
        <select
          value={basemapId}
          onChange={(event) =>
            onBasemapChange(event.target.value as BasemapId)
          }
        >
          {BASEMAP_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="map-controls__toggle" role="group" aria-label="Vista">
        <button
          type="button"
          className={viewMode === '2d' ? 'is-active' : undefined}
          aria-pressed={viewMode === '2d'}
          onClick={() => onViewModeChange('2d')}
        >
          2D
        </button>
        <button
          type="button"
          className={viewMode === '3d' ? 'is-active' : undefined}
          aria-pressed={viewMode === '3d'}
          onClick={() => onViewModeChange('3d')}
        >
          3D
        </button>
      </div>
    </aside>
  )
}

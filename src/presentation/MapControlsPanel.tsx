import { useEffect, useId, useRef, useState } from 'react'
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
  const [galleryOpen, setGalleryOpen] = useState(false)
  const rootRef = useRef<HTMLElement>(null)
  const labelId = useId()
  const activeBasemap =
    BASEMAP_OPTIONS.find((option) => option.id === basemapId) ??
    BASEMAP_OPTIONS[0]

  useEffect(() => {
    if (!galleryOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setGalleryOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [galleryOpen])

  return (
    <aside
      ref={rootRef}
      className="map-controls"
      aria-label="Controles del mapa"
    >
      <div className="map-controls__basemap">
        <button
          type="button"
          className={
            galleryOpen
              ? 'map-controls__basemap-toggle is-open'
              : 'map-controls__basemap-toggle'
          }
          aria-expanded={galleryOpen}
          aria-controls={labelId}
          title="Tipos de mapa base"
          onClick={() => setGalleryOpen((open) => !open)}
        >
          <img
            src={activeBasemap.thumbnailUrl}
            alt=""
            width={40}
            height={40}
          />
          <span>Mapas</span>
        </button>

        {galleryOpen && (
          <div
            id={labelId}
            className="map-controls__basemap-gallery"
            role="listbox"
            aria-label="Mapa base"
          >
            {BASEMAP_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={option.id === basemapId}
                className={
                  option.id === basemapId
                    ? 'map-controls__basemap-item is-active'
                    : 'map-controls__basemap-item'
                }
                onClick={() => {
                  onBasemapChange(option.id)
                  setGalleryOpen(false)
                }}
              >
                <img src={option.thumbnailUrl} alt="" width={72} height={72} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="map-controls__toggle" role="group" aria-label="Vista 2D o 3D">
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

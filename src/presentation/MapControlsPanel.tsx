import { useEffect, useId, useRef, useState } from 'react'
import {
  BASEMAP_OPTIONS,
  type BasemapId,
  type ViewMode,
} from '../domain/MapControls'
import styles from './MapControlsPanel.module.scss'

interface MapControlsPanelProps {
  basemapId: BasemapId
  viewMode: ViewMode
  onBasemapChange: (id: BasemapId) => void
  /** Omitir en vistas que no soportan 3D: oculta el toggle 2D/3D. */
  onViewModeChange?: (mode: ViewMode) => void
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
      className={styles.panel}
      aria-label="Controles del mapa"
    >
      <div className={styles.basemap}>
        <button
          type="button"
          className={
            galleryOpen
              ? `${styles.basemapToggle} ${styles.isOpen}`
              : styles.basemapToggle
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
            className={styles.gallery}
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
                    ? `${styles.basemapItem} ${styles.isActive}`
                    : styles.basemapItem
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

      {onViewModeChange && (
        <div className={styles.viewToggle} role="group" aria-label="Vista 2D o 3D">
          <button
            type="button"
            className={viewMode === '2d' ? styles.isActive : undefined}
            aria-pressed={viewMode === '2d'}
            onClick={() => onViewModeChange('2d')}
          >
            2D
          </button>
          <button
            type="button"
            className={viewMode === '3d' ? styles.isActive : undefined}
            aria-pressed={viewMode === '3d'}
            onClick={() => onViewModeChange('3d')}
          >
            3D
          </button>
        </div>
      )}
    </aside>
  )
}

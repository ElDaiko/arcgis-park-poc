import type { CSSProperties } from 'react'
import {
  formatCategoryLabel,
  type MapFeature,
} from '../domain/MapFeature'
import { isPoiCategory, POI_CATEGORY_META } from '../domain/PoiCategory'
import styles from './FeatureDetailPanel.module.scss'

interface FeatureDetailPanelProps {
  feature: MapFeature
  onClose: () => void
}

interface Chip {
  label: string
  /** Color de la categoría (catálogo de dominio); sin color usa el chip neutro. */
  color?: string
}

function getPrimaryChip(feature: MapFeature): Chip {
  if (isPoiCategory(feature.category)) {
    const meta = POI_CATEGORY_META[feature.category]
    return { label: meta.label, color: meta.color }
  }

  return { label: formatCategoryLabel(feature.category ?? feature.type) }
}

function getLayerBadge(feature: MapFeature): string | null {
  const primary = getPrimaryChip(feature).label
  const layerTitle = feature.layerTitle.trim()

  if (!layerTitle) {
    return null
  }

  if (layerTitle.toLowerCase() === primary.toLowerCase()) {
    return null
  }

  // Un POI ya se identifica por su categoría: el nombre de la capa sobra
  // (sea "Puntos de interés" local o "Punto de Interes" en AGOL).
  if (isPoiCategory(feature.category)) {
    return null
  }

  return layerTitle
}

export function FeatureDetailPanel({
  feature,
  onClose,
}: FeatureDetailPanelProps) {
  const layerBadge = getLayerBadge(feature)
  const primaryChip = getPrimaryChip(feature)

  return (
    <aside className={styles.panel} aria-live="polite">
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label="Cerrar detalle"
      >
        ×
      </button>

      {feature.imageUrl && (
        <div className={styles.media}>
          <img
            src={feature.imageUrl}
            alt={`Vista de ${feature.name}`}
            className={styles.image}
            loading="lazy"
          />
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>Elemento seleccionado</span>
          <h2 className={styles.title}>{feature.name}</h2>
        </div>

        <div className={styles.body}>
          <p className={styles.meta}>
            <span
              className={`${styles.chip} ${primaryChip.color ? styles.chipCategory : styles.chipPrimary}`}
              style={
                primaryChip.color
                  ? ({ '--chip-color': primaryChip.color } as CSSProperties)
                  : undefined
              }
            >
              {primaryChip.label}
            </span>
            {layerBadge && (
              <span className={`${styles.chip} ${styles.chipSecondary}`}>
                {layerBadge}
              </span>
            )}
          </p>
          {feature.description ? (
            <p className={styles.description}>{feature.description}</p>
          ) : (
            <p className={`${styles.description} ${styles.descriptionMuted}`}>
              Sin descripción disponible.
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}

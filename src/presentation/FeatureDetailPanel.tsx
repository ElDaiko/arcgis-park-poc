import {
  formatCategoryLabel,
  type MapFeature,
} from '../domain/MapFeature'

interface FeatureDetailPanelProps {
  feature: MapFeature
  onClose: () => void
}

const CATEGORY_CHIP_CLASS: Record<string, string> = {
  atraccion: 'feature-panel__chip--atraccion',
  gastronomia: 'feature-panel__chip--gastronomia',
  acuatico: 'feature-panel__chip--acuatico',
  deporte: 'feature-panel__chip--deporte',
  servicio: 'feature-panel__chip--servicio',
}

function getPrimaryChip(feature: MapFeature): {
  label: string
  className: string
} {
  if (feature.category) {
    return {
      label: formatCategoryLabel(feature.category),
      className:
        CATEGORY_CHIP_CLASS[feature.category] ??
        'feature-panel__chip--primary',
    }
  }

  return {
    label: formatCategoryLabel(feature.type),
    className: 'feature-panel__chip--primary',
  }
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

  if (feature.category && layerTitle === 'Puntos de interés') {
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
    <aside className="feature-panel feature-panel--active" aria-live="polite">
      <button
        type="button"
        className="feature-panel__close"
        onClick={onClose}
        aria-label="Cerrar detalle"
      >
        ×
      </button>

      {feature.imageUrl && (
        <div className="feature-panel__media">
          <img
            src={feature.imageUrl}
            alt={`Vista de ${feature.name}`}
            className="feature-panel__image"
            loading="lazy"
          />
        </div>
      )}

      <div className="feature-panel__content">
        <div className="feature-panel__heading">
          <span className="feature-panel__eyebrow">Elemento seleccionado</span>
          <h2>{feature.name}</h2>
        </div>

        <div className="feature-panel__body">
          <p className="feature-panel__meta">
            <span className={`feature-panel__chip ${primaryChip.className}`}>
              {primaryChip.label}
            </span>
            {layerBadge && (
              <span className="feature-panel__chip feature-panel__chip--secondary">
                {layerBadge}
              </span>
            )}
          </p>
          {feature.description ? (
            <p className="feature-panel__description">{feature.description}</p>
          ) : (
            <p className="feature-panel__description feature-panel__description--muted">
              Sin descripción disponible.
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}

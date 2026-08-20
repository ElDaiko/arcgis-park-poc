import type { MapFeature } from '../domain/MapFeature'

interface FeatureDetailPanelProps {
  feature: MapFeature | null
}

const TYPE_LABELS: Record<string, string> = {
  punto_interes: 'Punto de interés',
  atraccion: 'Atracción',
  servicio: 'Servicio',
  zona_principal: 'Zona principal',
  sendero_principal: 'Sendero principal',
  acceso_discapacitados: 'Acceso universal',
  bano: 'Baños',
  parqueadero: 'Parqueadero',
  primeros_auxilios: 'Primeros auxilios',
  informacion: 'Información',
}

function formatType(type: string): string {
  return TYPE_LABELS[type] ?? type
}

/** Evita duplicar chip de capa cuando ya lo dice el tipo (ej. POI + "Puntos de interés"). */
function getLayerBadge(feature: MapFeature): string | null {
  const typeLabel = formatType(feature.type)
  const layerTitle = feature.layerTitle.trim()

  if (!layerTitle) {
    return null
  }

  if (layerTitle.toLowerCase() === typeLabel.toLowerCase()) {
    return null
  }

  const poiTypes = new Set(['punto_interes', 'atraccion', 'servicio'])
  if (poiTypes.has(feature.type) && layerTitle === 'Puntos de interés') {
    return null
  }

  return layerTitle
}

export function FeatureDetailPanel({ feature }: FeatureDetailPanelProps) {
  const layerBadge = feature ? getLayerBadge(feature) : null

  return (
    <aside
      className={`feature-panel${feature ? ' feature-panel--active' : ''}`}
      aria-live="polite"
    >
      {feature?.imageUrl && (
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
          <h2>{feature ? feature.name : 'Selecciona un elemento'}</h2>
        </div>

        {feature ? (
          <div className="feature-panel__body">
            <p className="feature-panel__meta">
              <span className="feature-panel__chip feature-panel__chip--primary">
                {formatType(feature.type)}
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
        ) : (
          <p className="feature-panel__hint">
            Haz clic en el parque, un sendero o un punto de interés para ver su
            detalle e imagen. Activa o desactiva capas con el panel superior
            izquierdo.
          </p>
        )}
      </div>
    </aside>
  )
}

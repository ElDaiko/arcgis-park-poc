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
}

function formatType(type: string): string {
  return TYPE_LABELS[type] ?? type
}

export function FeatureDetailPanel({ feature }: FeatureDetailPanelProps) {
  return (
    <aside
      className={`feature-panel${feature ? ' feature-panel--active' : ''}`}
      aria-live="polite"
    >
      <div className="feature-panel__heading">
        <span className="feature-panel__eyebrow">Elemento seleccionado</span>
        <h2>{feature ? feature.name : 'Selecciona un elemento'}</h2>
      </div>

      {feature ? (
        <div className="feature-panel__body">
          <p className="feature-panel__meta">
            <span>{formatType(feature.type)}</span>
            <span>{feature.layerTitle}</span>
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
          detalle. También puedes activar o desactivar capas con el panel
          superior izquierdo.
        </p>
      )}
    </aside>
  )
}

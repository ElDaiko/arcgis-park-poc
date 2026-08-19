import type { Coordinate } from '../domain/Coordinate'

interface CoordinatePanelProps {
  coordinate: Coordinate | null
}

const formatDegrees = (value: number) => value.toFixed(6)
const formatMeters = (value: number) => value.toFixed(3)

export function CoordinatePanel({
  coordinate,
}: CoordinatePanelProps) {
  return (
    <aside className="coordinate-panel" aria-live="polite">
      <div className="coordinate-panel__heading">
        <span className="coordinate-panel__eyebrow">Ubicación seleccionada</span>
        <h1>Coordenadas</h1>
      </div>

      {coordinate ? (
        <div className="coordinate-panel__formats">
          <section>
            <div className="coordinate-panel__label">
              <strong>WGS84</strong>
              <span>EPSG:4326 · grados</span>
            </div>
            <dl>
              <div>
                <dt>Latitud</dt>
                <dd>{formatDegrees(coordinate.latitude)}°</dd>
              </div>
              <div>
                <dt>Longitud</dt>
                <dd>{formatDegrees(coordinate.longitude)}°</dd>
              </div>
            </dl>
          </section>

          <section>
            <div className="coordinate-panel__label">
              <strong>MAGNA-SIRGAS Origen Nacional</strong>
              <span>EPSG:9377 · metros</span>
            </div>
            <dl>
              <div>
                <dt>X</dt>
                <dd>{formatMeters(coordinate.x)} m</dd>
              </div>
              <div>
                <dt>Y</dt>
                <dd>{formatMeters(coordinate.y)} m</dd>
              </div>
            </dl>
          </section>
        </div>
      ) : (
        <p className="coordinate-panel__empty">
          Haz clic sobre el mapa para consultar las coordenadas.
        </p>
      )}
    </aside>
  )
}

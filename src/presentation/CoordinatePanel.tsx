import type { Coordinate } from '../domain/Coordinate'
import styles from './CoordinatePanel.module.scss'

interface CoordinatePanelProps {
  coordinate: Coordinate | null
}

const formatDegrees = (value: number) => value.toFixed(6)
const formatMeters = (value: number) => value.toFixed(3)

export function CoordinatePanel({
  coordinate,
}: CoordinatePanelProps) {
  return (
    <aside className={styles.panel} aria-live="polite">
      <div className={styles.heading}>
        <span className={styles.eyebrow}>Ubicación seleccionada</span>
        <h1 className={styles.title}>Coordenadas</h1>
      </div>

      {coordinate ? (
        <div className={styles.formats}>
          <section>
            <div className={styles.label}>
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
            <div className={styles.label}>
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
        <p className={styles.empty}>
          Haz clic sobre el mapa para consultar las coordenadas.
        </p>
      )}
    </aside>
  )
}

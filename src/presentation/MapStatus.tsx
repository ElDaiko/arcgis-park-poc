import styles from './MapStatus.module.scss'

/** Velo de carga a pantalla completa sobre el mapa. */
export function MapLoading({ message }: { message: string }) {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

/** Alerta de error anclada abajo a la izquierda del mapa. */
export function MapError({ title, message }: { title: string; message: string }) {
  return (
    <div className={styles.error} role="alert">
      <strong>{title}</strong>
      <span>{message}</span>
    </div>
  )
}

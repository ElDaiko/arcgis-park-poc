import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import styles from './MapShell.module.scss'

interface MapShellProps {
  mapRef: RefObject<HTMLDivElement | null>
  mapLabel: string
  /** Columna izquierda (filtros). Los widgets ArcGIS top-left se ubican debajo. */
  topLeft?: ReactNode
  /** Centro superior (controles de mapa base / 2D-3D). */
  topCenter?: ReactNode
  /** Columna derecha, arriba (coordenadas, paneles informativos, acciones). */
  topRight?: ReactNode
  /** Columna derecha, abajo (detalle del elemento seleccionado). */
  bottomRight?: ReactNode
  /** Capas de estado a pantalla completa (carga, errores). */
  children?: ReactNode
}

/**
 * Contenedor común de todas las páginas de mapa.
 *
 * Los paneles React se colocan en slots de una grilla superpuesta, de modo que
 * se apilan en lugar de solaparse. Los widgets nativos de ArcGIS (LayerList,
 * Legend, zoom) viven en otra capa del DOM; para que no queden tapados, el
 * shell mide los slots y expone su tamaño como custom properties que el SCSS
 * usa para desplazar las esquinas de `.esri-ui`.
 */
export function MapShell({
  mapRef,
  mapLabel,
  topLeft,
  topCenter,
  topRight,
  bottomRight,
  children,
}: MapShellProps) {
  const shellRef = useRef<HTMLElement>(null)
  const topLeftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const bottomRightRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const shell = shellRef.current
    if (!shell) return

    const update = () => {
      const shellRect = shell.getBoundingClientRect()
      const topLeftRect = topLeftRef.current?.getBoundingClientRect()
      const rightRect = rightRef.current?.getBoundingClientRect()
      const bottomRect = bottomRightRef.current?.getBoundingClientRect()

      const topLeftOffset =
        topLeftRect && topLeftRect.height > 0
          ? topLeftRect.bottom - shellRect.top
          : 0
      const bottomRightOffset =
        bottomRect && bottomRect.height > 0
          ? shellRect.bottom - bottomRect.top
          : 0
      const rightStackOffset =
        rightRect && rightRect.height > 0 ? shellRect.bottom - rightRect.top : 0

      // Sin slot, se elimina la variable y el SCSS usa su valor por defecto.
      const setOffset = (name: string, value: number) => {
        if (value > 0) {
          shell.style.setProperty(name, `${value}px`)
        } else {
          shell.style.removeProperty(name)
        }
      }

      setOffset('--slot-top-left-offset', topLeftOffset)
      setOffset('--slot-bottom-right-offset', bottomRightOffset)
      setOffset('--slot-right-stack-offset', rightStackOffset)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(shell)
    for (const el of [topLeftRef.current, bottomRightRef.current]) {
      if (el) observer.observe(el)
    }
    // En móvil la columna derecha crece con su contenido: observar sus hijos.
    for (const child of Array.from(rightRef.current?.children ?? [])) {
      observer.observe(child)
    }

    return () => observer.disconnect()
  }, [topLeft, topRight, bottomRight])

  return (
    <main ref={shellRef} className={styles.shell}>
      <div ref={mapRef} className={styles.map} aria-label={mapLabel} />

      <div className={styles.overlay}>
        {topLeft && (
          <div ref={topLeftRef} className={styles.topLeft}>
            {topLeft}
          </div>
        )}
        {topCenter && <div className={styles.topCenter}>{topCenter}</div>}
        {(topRight || bottomRight) && (
          <div ref={rightRef} className={styles.right}>
            {topRight && <div className={styles.rightTop}>{topRight}</div>}
            {bottomRight && (
              <div ref={bottomRightRef} className={styles.rightBottom}>
                {bottomRight}
              </div>
            )}
          </div>
        )}
      </div>

      {children}
    </main>
  )
}

import type { ReactNode } from 'react'
import styles from './SidePanel.module.scss'

interface SidePanelProps {
  eyebrow: string
  title: string
  ariaLabel: string
  children?: ReactNode
}

/** Tarjeta informativa con el mismo encabezado que el resto de paneles. */
export function SidePanel({ eyebrow, title, ariaLabel, children }: SidePanelProps) {
  return (
    <section className={styles.panel} aria-label={ariaLabel}>
      <div className={styles.heading}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h2 className={styles.title}>{title}</h2>
      </div>
      {children && <div className={styles.body}>{children}</div>}
    </section>
  )
}

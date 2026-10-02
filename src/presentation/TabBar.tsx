import styles from './TabBar.module.scss'

export type AppPage = 'map' | 'density' | 'webmap' | 'webmap-styled'

interface TabBarProps {
  activePage: AppPage
  onChange: (page: AppPage) => void
}

const TABS: { id: AppPage; label: string; shortLabel: string; icon: string }[] = [
  { id: 'map', label: 'Mapa del Parque', shortLabel: 'Parque', icon: '🗺' },
  { id: 'density', label: 'Análisis de Densidad', shortLabel: 'Densidad', icon: '📊' },
  { id: 'webmap', label: 'Web Map (AGOL)', shortLabel: 'AGOL', icon: '☁️' },
  { id: 'webmap-styled', label: 'Web Map + estilo local', shortLabel: 'Estilizado', icon: '🎨' },
]

export function TabBar({ activePage, onChange }: TabBarProps) {
  return (
    <nav className={styles.bar} aria-label="Páginas de la aplicación">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === activePage}
          className={
            tab.id === activePage ? `${styles.tab} ${styles.isActive}` : styles.tab
          }
          onClick={() => onChange(tab.id)}
        >
          <span className={styles.icon} aria-hidden="true">
            {tab.icon}
          </span>
          <span className={styles.label}>{tab.label}</span>
          <span className={styles.shortLabel} aria-hidden="true">
            {tab.shortLabel}
          </span>
        </button>
      ))}
    </nav>
  )
}

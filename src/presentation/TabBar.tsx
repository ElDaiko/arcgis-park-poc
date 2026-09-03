export type AppPage = 'map' | 'density'

interface TabBarProps {
  activePage: AppPage
  onChange: (page: AppPage) => void
}

const TABS: { id: AppPage; label: string; icon: string }[] = [
  { id: 'map', label: 'Mapa del Parque', icon: '🗺' },
  { id: 'density', label: 'Análisis de Densidad', icon: '📊' },
]

export function TabBar({ activePage, onChange }: TabBarProps) {
  return (
    <nav className="tab-bar" aria-label="Páginas de la aplicación">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === activePage}
          className={
            tab.id === activePage ? 'tab-bar__tab is-active' : 'tab-bar__tab'
          }
          onClick={() => onChange(tab.id)}
        >
          <span className="tab-bar__icon" aria-hidden="true">
            {tab.icon}
          </span>
          <span className="tab-bar__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

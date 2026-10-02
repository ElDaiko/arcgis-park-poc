import { lazy, Suspense, useState, type ReactNode } from 'react'
import styles from './App.module.scss'
import { MapLoading } from './presentation/MapStatus'
import { TabBar, type AppPage } from './presentation/TabBar'

// Cada pestaña es un chunk propio: ArcGIS (MapView, SceneView, WebMap…) y sus
// dependencias solo se descargan cuando el usuario abre la pestaña.
const MapComponent = lazy(() =>
  import('./presentation/MapComponent').then((m) => ({ default: m.MapComponent })),
)
const DensityMapPage = lazy(() =>
  import('./presentation/DensityMapPage').then((m) => ({
    default: m.DensityMapPage,
  })),
)
const WebMapPage = lazy(() =>
  import('./presentation/WebMapPage').then((m) => ({ default: m.WebMapPage })),
)
const StyledWebMapPage = lazy(() =>
  import('./presentation/StyledWebMapPage').then((m) => ({
    default: m.StyledWebMapPage,
  })),
)

const PAGES: Record<AppPage, () => ReactNode> = {
  map: () => <MapComponent />,
  density: () => <DensityMapPage />,
  webmap: () => <WebMapPage />,
  'webmap-styled': () => <StyledWebMapPage />,
}

const PAGE_ORDER: AppPage[] = ['map', 'density', 'webmap', 'webmap-styled']

function App() {
  const [activePage, setActivePage] = useState<AppPage>('map')
  // Cada página se monta la primera vez que se visita y luego se conserva
  // (oculta) para no recrear la vista ArcGIS al cambiar de pestaña. Montarla
  // al visitarla garantiza que su contenedor ya tiene dimensiones reales.
  const [mountedPages, setMountedPages] = useState<ReadonlySet<AppPage>>(
    () => new Set(['map']),
  )

  const handlePageChange = (page: AppPage) => {
    setMountedPages((current) =>
      current.has(page) ? current : new Set([...current, page]),
    )
    setActivePage(page)
  }

  return (
    <div className={styles.root}>
      <TabBar activePage={activePage} onChange={handlePageChange} />
      {PAGE_ORDER.map((page) => (
        <div
          key={page}
          className={
            page === activePage ? `${styles.page} ${styles.isVisible}` : styles.page
          }
        >
          {mountedPages.has(page) && (
            <Suspense fallback={<MapLoading message="Cargando vista…" />}>
              {PAGES[page]()}
            </Suspense>
          )}
        </div>
      ))}
    </div>
  )
}

export default App

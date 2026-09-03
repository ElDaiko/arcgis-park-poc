import { useState } from 'react'
import './App.css'
import { MapComponent } from './presentation/MapComponent'
import { DensityMapPage } from './presentation/DensityMapPage'
import { TabBar, type AppPage } from './presentation/TabBar'

function App() {
  const [activePage, setActivePage] = useState<AppPage>('map')
  // Track whether the density tab has been visited at least once.
  // This lazily mounts DensityMapPage the first time the user opens that tab,
  // ensuring its map container already has real dimensions.
  const [densityMounted, setDensityMounted] = useState(false)

  const handlePageChange = (page: AppPage) => {
    if (page === 'density') setDensityMounted(true)
    setActivePage(page)
  }

  return (
    <div className="app-root">
      <TabBar activePage={activePage} onChange={handlePageChange} />
      <div className={activePage === 'map' ? 'app-page is-visible' : 'app-page'}>
        <MapComponent />
      </div>
      <div className={activePage === 'density' ? 'app-page is-visible' : 'app-page'}>
        {densityMounted && <DensityMapPage />}
      </div>
    </div>
  )
}

export default App

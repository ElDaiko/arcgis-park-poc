import { useState } from 'react'
import './App.css'
import { MapComponent } from './presentation/MapComponent'
import { DensityMapPage } from './presentation/DensityMapPage'
import { WebMapPage } from './presentation/WebMapPage'
import { StyledWebMapPage } from './presentation/StyledWebMapPage'
import { TabBar, type AppPage } from './presentation/TabBar'

function App() {
  const [activePage, setActivePage] = useState<AppPage>('map')
  // Track whether the density tab has been visited at least once.
  // This lazily mounts DensityMapPage the first time the user opens that tab,
  // ensuring its map container already has real dimensions.
  const [densityMounted, setDensityMounted] = useState(false)
  const [webmapMounted, setWebmapMounted] = useState(false)
  const [styledWebmapMounted, setStyledWebmapMounted] = useState(false)

  const handlePageChange = (page: AppPage) => {
    if (page === 'density') setDensityMounted(true)
    if (page === 'webmap') setWebmapMounted(true)
    if (page === 'webmap-styled') setStyledWebmapMounted(true)
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
      <div className={activePage === 'webmap' ? 'app-page is-visible' : 'app-page'}>
        {webmapMounted && <WebMapPage />}
      </div>
      <div className={activePage === 'webmap-styled' ? 'app-page is-visible' : 'app-page'}>
        {styledWebmapMounted && <StyledWebMapPage />}
      </div>
    </div>
  )
}

export default App

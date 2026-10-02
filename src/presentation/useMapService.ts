import { useEffect, useRef, useState } from 'react'
import type { Coordinate } from '../domain/Coordinate'
import type { IMapService } from '../domain/IMapService'
import type { MapFeature } from '../domain/MapFeature'
import { DEFAULT_BASEMAP, type BasemapId } from '../domain/MapControls'
import {
  isPoiCategory,
  POI_CATEGORIES,
  type PoiCategory,
} from '../domain/PoiCategory'
import { errorMessage } from './errorMessage'

/**
 * Estado y acciones comunes de las páginas que usan un IMapService
 * (mapa del parque y Web Map estilizado): coordenadas, selección, filtro por
 * categoría y mapa base. Solo cambia la implementación que crea `createService`.
 *
 * `createService` se usa una única vez, al montar la página.
 */
export function useMapService<T extends IMapService>(
  createService: () => T,
  loadErrorMessage: string,
) {
  const mapRef = useRef<HTMLDivElement>(null)
  const serviceRef = useRef<T | null>(null)
  const createServiceRef = useRef(createService)
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null)
  const [selectedFeature, setSelectedFeature] = useState<MapFeature | null>(null)
  const [activeCategories, setActiveCategories] = useState<PoiCategory[]>([
    ...POI_CATEGORIES,
  ])
  const [basemapId, setBasemapId] = useState<BasemapId>(DEFAULT_BASEMAP)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const container = mapRef.current
    if (!container) return

    const service = createServiceRef.current()
    serviceRef.current = service

    void service
      .initialize(container, {
        onCoordinateChange: setCoordinate,
        onFeatureSelect: setSelectedFeature,
      })
      .then(() => setIsReady(true))
      .catch((reason: unknown) => {
        setError(errorMessage(reason, loadErrorMessage))
      })

    return () => {
      service.destroy()
      serviceRef.current = null
    }
  }, [loadErrorMessage])

  const clearSelection = () => {
    setSelectedFeature(null)
    serviceRef.current?.clearSelection()
  }

  const changeCategories = (categories: PoiCategory[]) => {
    setActiveCategories(categories)
    serviceRef.current?.setPoiCategoryFilter(categories)

    // Si el filtro oculta el elemento seleccionado, se cierra su detalle.
    const selected = selectedFeature?.category
    if (isPoiCategory(selected) && !categories.includes(selected)) {
      clearSelection()
    }
  }

  const changeBasemap = (id: BasemapId) => {
    setBasemapId(id)
    serviceRef.current?.setBasemap(id)
  }

  return {
    mapRef,
    serviceRef,
    coordinate,
    selectedFeature,
    activeCategories,
    basemapId,
    error,
    setError,
    isReady,
    clearSelection,
    changeCategories,
    changeBasemap,
  }
}

import type FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import { formatCategoryLabel } from '../../domain/MapFeature'

/** Datos agregados del Web Map, listos para el informe PDF. */
export interface WebMapReportData {
  poiCount: number
  trailCount: number
  infrastructureCount: number
  poisByCategory: CategoryCount[]
  pois: PoiRow[]
}

export interface CategoryCount {
  category: string
  label: string
  count: number
}

export interface PoiRow {
  nombre: string
  categoria: string
  categoriaLabel: string
  descripcion: string
}

async function safeCount(layer: FeatureLayer | null): Promise<number> {
  if (!layer) return 0
  try {
    return await layer.queryFeatureCount({ where: '1=1' })
  } catch {
    return 0
  }
}

/**
 * Consulta las capas del Web Map y calcula las agregaciones del informe:
 * conteos por capa, POIs por categoría y el listado de POIs.
 */
export async function buildWebMapReportData(layers: {
  pois: FeatureLayer | null
  trails: FeatureLayer | null
  infrastructure: FeatureLayer | null
}): Promise<WebMapReportData> {
  const [poiCount, trailCount, infrastructureCount] = await Promise.all([
    safeCount(layers.pois),
    safeCount(layers.trails),
    safeCount(layers.infrastructure),
  ])

  const pois: PoiRow[] = []
  const categoryMap = new Map<string, number>()

  if (layers.pois) {
    const result = await layers.pois.queryFeatures({
      where: '1=1',
      outFields: ['nombre', 'categoria', 'descripcion'],
      returnGeometry: false,
    })

    for (const f of result.features) {
      const a = f.attributes as Record<string, unknown>
      const categoria = String(a.categoria ?? '').trim()
      pois.push({
        nombre: String(a.nombre ?? 'Sin nombre'),
        categoria,
        categoriaLabel: formatCategoryLabel(categoria),
        descripcion: String(a.descripcion ?? ''),
      })
      categoryMap.set(categoria, (categoryMap.get(categoria) ?? 0) + 1)
    }
  }

  const poisByCategory: CategoryCount[] = [...categoryMap.entries()]
    .map(([category, count]) => ({
      category,
      label: formatCategoryLabel(category),
      count,
    }))
    .sort((a, b) => b.count - a.count)

  pois.sort((a, b) => a.categoria.localeCompare(b.categoria))

  return {
    poiCount,
    trailCount,
    infrastructureCount,
    poisByCategory,
    pois,
  }
}

import type GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'

/** Datos agregados del análisis de densidad, listos para el informe PDF. */
export interface DensityReportData {
  totalCells: number
  totalAforo: number
  totalCapacity: number
  occupancyPercent: number
  zones: DensityZoneSummary[]
  criticalCells: DensityCellRow[]
}

export interface DensityZoneSummary {
  zone: string
  cells: number
  aforo: number
  capacity: number
  occupancyPercent: number
}

export interface DensityCellRow {
  id: string
  nombre: string
  zona: string
  aforo: number
  capacidad: number
  indice: number
  nivelUso: number
}

interface DensityAttributes {
  id: string
  nombre: string
  zona: string
  aforo_actual: number
  indice_densidad: number
  nivel_uso: number
  capacidad_maxima: number
}

/**
 * Consulta todas las celdas de la capa de densidad y calcula las
 * agregaciones que alimentan el informe (KPIs, por zona, celdas críticas).
 */
export async function buildDensityReportData(
  layer: GeoJSONLayer,
): Promise<DensityReportData> {
  const result = await layer.queryFeatures({
    where: '1=1',
    outFields: [
      'id',
      'nombre',
      'zona',
      'aforo_actual',
      'indice_densidad',
      'nivel_uso',
      'capacidad_maxima',
    ],
    returnGeometry: false,
  })

  const rows: DensityCellRow[] = result.features.map((f) => {
    const a = f.attributes as DensityAttributes
    return {
      id: a.id,
      nombre: a.nombre,
      zona: a.zona,
      aforo: a.aforo_actual ?? 0,
      capacidad: a.capacidad_maxima ?? 0,
      indice: a.indice_densidad ?? 0,
      nivelUso: a.nivel_uso ?? 0,
    }
  })

  const totalAforo = rows.reduce((sum, r) => sum + r.aforo, 0)
  const totalCapacity = rows.reduce((sum, r) => sum + r.capacidad, 0)
  const occupancyPercent =
    totalCapacity > 0 ? (totalAforo / totalCapacity) * 100 : 0

  // Agregación por zona.
  const zoneMap = new Map<string, DensityZoneSummary>()
  for (const r of rows) {
    const z = zoneMap.get(r.zona) ?? {
      zone: r.zona,
      cells: 0,
      aforo: 0,
      capacity: 0,
      occupancyPercent: 0,
    }
    z.cells += 1
    z.aforo += r.aforo
    z.capacity += r.capacidad
    zoneMap.set(r.zona, z)
  }
  const zones = [...zoneMap.values()]
    .map((z) => ({
      ...z,
      occupancyPercent: z.capacity > 0 ? (z.aforo / z.capacity) * 100 : 0,
    }))
    .sort((a, b) => b.occupancyPercent - a.occupancyPercent)

  // Celdas críticas: top 10 por índice de densidad (descendente).
  const criticalCells = [...rows]
    .sort((a, b) => b.indice - a.indice)
    .slice(0, 10)

  return {
    totalCells: rows.length,
    totalAforo,
    totalCapacity,
    occupancyPercent,
    zones,
    criticalCells,
  }
}

import type { PoiCategory } from '../../domain/PoiCategory'
import { POI_CATEGORIES } from '../../domain/PoiCategory'

/** Construye un `definitionExpression` para GeoJSONLayer de POIs. */
export function buildPoiCategoryExpression(
  categories: readonly PoiCategory[],
): string {
  if (categories.length === 0) {
    return '1 = 0'
  }

  if (categories.length === POI_CATEGORIES.length) {
    return '1 = 1'
  }

  const quoted = categories.map((category) => `'${category}'`).join(', ')
  return `categoria IN (${quoted})`
}

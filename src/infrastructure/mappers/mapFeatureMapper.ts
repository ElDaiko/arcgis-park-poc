import type Graphic from '@arcgis/core/Graphic'
import type Layer from '@arcgis/core/layers/Layer'
import {
  formatCategoryLabel,
  type MapFeature,
} from '../../domain/MapFeature'

function readAttribute(
  attributes: Record<string, unknown>,
  key: string,
): string {
  const direct = attributes[key]
  if (direct != null && String(direct).trim()) {
    return String(direct)
  }

  const match = Object.entries(attributes).find(
    ([entryKey]) => entryKey.toLowerCase() === key.toLowerCase(),
  )

  return match?.[1] != null ? String(match[1]) : ''
}

export function toMapFeature(graphic: Graphic, layer: Layer): MapFeature {
  const attributes = graphic.attributes as Record<string, unknown>
  const category = readAttribute(attributes, 'categoria')
  const type =
    category ||
    readAttribute(attributes, 'tipo') ||
    'desconocido'
  const name =
    readAttribute(attributes, 'nombre') ||
    readAttribute(attributes, 'name') ||
    formatCategoryLabel(type) ||
    'Sin nombre'

  return {
    name,
    type,
    category: category || undefined,
    description: readAttribute(attributes, 'descripcion'),
    layerTitle: layer.title ?? 'Capa',
    imageUrl: readAttribute(attributes, 'imagen') || undefined,
  }
}

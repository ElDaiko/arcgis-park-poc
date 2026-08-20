import type Graphic from '@arcgis/core/Graphic'
import type Layer from '@arcgis/core/layers/Layer'
import type { MapFeature } from '../../domain/MapFeature'

const TYPE_LABELS: Record<string, string> = {
  punto_interes: 'Punto de interés',
  atraccion: 'Atracción',
  servicio: 'Servicio',
  zona_principal: 'Zona principal',
  sendero_principal: 'Sendero principal',
  acceso_discapacitados: 'Acceso universal',
  bano: 'Baños',
  parqueadero: 'Parqueadero',
  primeros_auxilios: 'Primeros auxilios',
  informacion: 'Información',
}

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
  const type = readAttribute(attributes, 'tipo')
  const name =
    readAttribute(attributes, 'nombre') ||
    readAttribute(attributes, 'name') ||
    TYPE_LABELS[type] ||
    'Sin nombre'

  return {
    name,
    type: type || 'desconocido',
    description: readAttribute(attributes, 'descripcion'),
    layerTitle: layer.title ?? 'Capa',
    imageUrl: readAttribute(attributes, 'imagen') || undefined,
  }
}

import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol'

/** Colores semánticos de los pins de infraestructura — sin peticiones externas. */
export const PIN_COLORS = {
  red: '#db0061',
  blue: '#2563eb',
  green: '#008444',
  yellow: '#ca8a04',
  orange: '#ea580c',
} as const

/** Pin circular con borde blanco del color indicado. */
export function createPinSymbol(color: string, size = 26): SimpleMarkerSymbol {
  return new SimpleMarkerSymbol({
    style: 'circle',
    color,
    size: `${size}px`,
    outline: { color: '#ffffff', width: 1.5 },
  })
}

export function createEsriPinSymbol(
  color: keyof typeof PIN_COLORS,
  size = 26,
): SimpleMarkerSymbol {
  return createPinSymbol(PIN_COLORS[color], size)
}

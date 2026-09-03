import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol'

/** Colores semánticos por categoría — sin peticiones externas. */
const PIN_COLORS = {
  red: '#db0061',
  blue: '#2563eb',
  green: '#008444',
  yellow: '#ca8a04',
  orange: '#ea580c',
} as const

export function createEsriPinSymbol(
  color: keyof typeof PIN_COLORS,
  size = 26,
): SimpleMarkerSymbol {
  return new SimpleMarkerSymbol({
    style: 'circle',
    color: PIN_COLORS[color],
    size: `${size}px`,
    outline: { color: '#ffffff', width: 1.5 },
  })
}

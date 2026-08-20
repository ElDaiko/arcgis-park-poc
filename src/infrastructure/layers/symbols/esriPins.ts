import PictureMarkerSymbol from '@arcgis/core/symbols/PictureMarkerSymbol'

/** Pins estándar del CDN de Esri (Shapes). */
const ESRI_PINS = {
  red: 'https://static.arcgis.com/images/Symbols/Shapes/RedPin1LargeB.png',
  blue: 'https://static.arcgis.com/images/Symbols/Shapes/BluePin1LargeB.png',
  green: 'https://static.arcgis.com/images/Symbols/Shapes/GreenPin1LargeB.png',
  yellow: 'https://static.arcgis.com/images/Symbols/Shapes/YellowPin1LargeB.png',
  orange: 'https://static.arcgis.com/images/Symbols/Shapes/OrangePin1LargeB.png',
} as const

export function createEsriPinSymbol(
  color: keyof typeof ESRI_PINS,
  size = 26,
): PictureMarkerSymbol {
  return new PictureMarkerSymbol({
    url: ESRI_PINS[color],
    width: `${size}px`,
    height: `${size}px`,
  })
}

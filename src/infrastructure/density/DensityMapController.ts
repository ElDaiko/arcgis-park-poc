import esriConfig from '@arcgis/core/config'
import Map from '@arcgis/core/Map'
// Suppress the recurring source-sans-3-bold 404 that fires when popups
// request that font family, which does not exist on the ArcGIS CDN.
esriConfig.fontsUrl = 'https://static.arcgis.com/fonts'

import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import SceneView from '@arcgis/core/views/SceneView'
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer'
import Legend from '@arcgis/core/widgets/Legend'
import Expand from '@arcgis/core/widgets/Expand'
import { buildDensityReportData } from '../reports/densityReportData'
import { generateDensityReport } from '../reports/pdfReport'

export type DensityField = 'indice_densidad' | 'aforo_actual'

export interface DensityMapCallbacks {
  onReady: () => void
  onError: (message: string) => void
  onRendererApplied: (field: DensityField) => void
}

const DENSITY_GEOJSON_URL = '/data/densidad-parques.geojson'

// Centro: parque Comfama Tutucán
const PARK_CENTER: [number, number] = [-75.3788, 6.1382]

// ---------------------------------------------------------------------------
// Visual variable configuration per field
// ---------------------------------------------------------------------------

interface FieldConfig {
  minDataValue: number
  maxDataValue: number
  /** Extrusion height in metres for the minimum value */
  minSize: number
  /** Extrusion height in metres for the maximum value */
  maxSize: number
  colorStops: Array<{ value: number; color: string }>
  label: string
}

// Cells are ~90 m wide. Max height sits slightly above the footprint so
// columns read as slender towers, not as oversized buildings.
const FIELD_CONFIGS: Record<DensityField, FieldConfig> = {
  indice_densidad: {
    minDataValue: 0,
    maxDataValue: 1,
    minSize: 6,
    maxSize: 90,
    colorStops: [
      { value: 0, color: '#fff7bc' },
      { value: 0.25, color: '#fec44f' },
      { value: 0.5, color: '#fe9929' },
      { value: 0.75, color: '#d95f0e' },
      { value: 1, color: '#8c2d04' },
    ],
    label: 'Índice de densidad',
  },
  aforo_actual: {
    minDataValue: 0,
    maxDataValue: 350,
    minSize: 6,
    maxSize: 90,
    colorStops: [
      { value: 0, color: '#fff7bc' },
      { value: 88, color: '#fec44f' },
      { value: 175, color: '#fe9929' },
      { value: 263, color: '#d95f0e' },
      { value: 350, color: '#8c2d04' },
    ],
    label: 'Aforo actual (personas)',
  },
}

// ---------------------------------------------------------------------------

export class DensityMapController {
  private readonly apiKey: string
  private map: Map | null = null
  private view: SceneView | null = null
  private geoLayer: GeoJSONLayer | null = null
  private legendExpand: Expand | null = null
  private destroyed = false
  private currentField: DensityField = 'indice_densidad'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async initialize(
    container: HTMLDivElement,
    callbacks: DensityMapCallbacks,
  ): Promise<void> {
    if (!this.apiKey.trim()) {
      callbacks.onError(
        'Falta VITE_ARCGIS_API_KEY. Configúrala en un archivo .env local.',
      )
      return
    }

    esriConfig.apiKey = this.apiKey

    if (this.destroyed) return

    const geoLayer = new GeoJSONLayer({
      url: DENSITY_GEOJSON_URL,
      outFields: [
        'id',
        'nombre',
        'zona',
        'aforo_actual',
        'indice_densidad',
        'nivel_uso',
        'capacidad_maxima',
      ],
      elevationInfo: { mode: 'on-the-ground' },
      opacity: 0.85,
      popupEnabled: true,
      popupTemplate: {
        title: '{nombre}',
        content: [
          {
            type: 'fields',
            fieldInfos: [
              { fieldName: 'zona', label: 'Zona' },
              {
                fieldName: 'aforo_actual',
                label: 'Aforo actual',
                format: { digitSeparator: true, places: 0 },
              },
              {
                fieldName: 'capacidad_maxima',
                label: 'Capacidad máxima',
                format: { digitSeparator: true, places: 0 },
              },
              {
                fieldName: 'indice_densidad',
                label: 'Índice de densidad',
                format: { places: 2 },
              },
              {
                fieldName: 'nivel_uso',
                label: 'Nivel de uso',
                format: { places: 0 },
              },
            ],
          },
        ],
      },
    })

    this.geoLayer = geoLayer

    this.map = new Map({
      basemap: 'gray-vector',
      ground: {
        navigationConstraint: { type: 'none' },
        surfaceColor: [245, 245, 243],
      },
      layers: [geoLayer],
    })

    this.view = new SceneView({
      container,
      map: this.map,
      qualityProfile: 'high',
      camera: {
        position: {
          longitude: PARK_CENTER[0] - 0.012,
          latitude: PARK_CENTER[1] - 0.032,
          z: 2800,
        },
        tilt: 55,
        heading: 25,
      },
      environment: {
        lighting: {
          date: new Date('2026-09-03T15:00:00'),
          directShadowsEnabled: false,
        },
      },
      popup: { dockEnabled: false },
    })

    await Promise.all([this.view.when(), geoLayer.load()])

    if (this.destroyed || !this.view) return

    this.applyExtrusionRenderer(geoLayer, 'indice_densidad')

    const legend = new Legend({
      view: this.view,
      layerInfos: [{ layer: geoLayer, title: 'Densidad por celda' }],
    })
    this.legendExpand = new Expand({
      view: this.view,
      content: legend,
      expanded: true,
      expandTooltip: 'Leyenda',
    })
    this.view.ui.add(this.legendExpand, 'bottom-right')

    callbacks.onReady()

    if (!this.destroyed) {
      callbacks.onRendererApplied('indice_densidad')
    }
  }

  // -------------------------------------------------------------------------
  // 3-D extrusion renderer with colour ramp + size visual variables
  // -------------------------------------------------------------------------

  private applyExtrusionRenderer(layer: GeoJSONLayer, field: DensityField): void {
    const cfg = FIELD_CONFIGS[field]
    this.currentField = field

    const renderer = new SimpleRenderer({
      symbol: {
        type: 'polygon-3d',
        symbolLayers: [
          {
            type: 'extrude',
            material: { color: '#fec44f' },
            edges: {
              type: 'solid',
              color: [0, 0, 0, 0.2],
              size: 0.5,
            },
          },
        ],
      } as unknown as __esri.PolygonSymbol3D,
      visualVariables: [
        {
          type: 'size',
          field,
          axis: 'height',
          minDataValue: cfg.minDataValue,
          maxDataValue: cfg.maxDataValue,
          minSize: cfg.minSize,
          maxSize: cfg.maxSize,
        } as __esri.SizeVariableProperties,
        {
          type: 'color',
          field,
          stops: cfg.colorStops.map((s) => ({
            value: s.value,
            color: s.color,
          })),
        } as __esri.ColorVariableProperties,
      ],
    })

    layer.renderer = renderer
  }

  // -------------------------------------------------------------------------

  async switchField(field: DensityField): Promise<void> {
    if (!this.geoLayer || !this.view || this.destroyed) return
    this.applyExtrusionRenderer(this.geoLayer, field)
  }

  getCurrentField(): DensityField {
    return this.currentField
  }

  /**
   * Genera y descarga el informe PDF de densidad: captura la vista 3D actual,
   * agrega los datos de las celdas y compone el PDF.
   */
  async downloadReport(): Promise<void> {
    if (!this.view || !this.geoLayer || this.destroyed) {
      throw new Error('El mapa de densidad no está listo.')
    }

    let mapImage: string | null = null
    try {
      const screenshot = await this.view.takeScreenshot({
        format: 'png',
        quality: 90,
      })
      mapImage = screenshot.dataUrl
    } catch {
      // Si falla la captura, el informe se genera igual sin imagen.
      mapImage = null
    }

    const data = await buildDensityReportData(this.geoLayer)
    generateDensityReport(data, mapImage)
  }

  destroy(): void {
    this.destroyed = true
    this.legendExpand?.destroy()
    this.legendExpand = null

    if (this.view) {
      this.view.map = null as unknown as Map
      this.view.destroy()
      this.view = null
    }

    this.map?.destroy()
    this.map = null
    this.geoLayer = null
  }
}

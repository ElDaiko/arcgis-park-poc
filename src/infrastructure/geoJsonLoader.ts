import Graphic from '@arcgis/core/Graphic'
import Point from '@arcgis/core/geometry/Point'
import Polygon from '@arcgis/core/geometry/Polygon'
import SpatialReference from '@arcgis/core/geometry/SpatialReference'
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol'
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol'

const WGS84 = new SpatialReference({ wkid: 4326 })

interface GeoJsonPointFeature {
  type: 'Feature'
  properties: {
    nombre?: string
    tipo?: string
    descripcion?: string
  }
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
}

interface GeoJsonPolygonFeature {
  type: 'Feature'
  properties: {
    nombre?: string
    tipo?: string
    descripcion?: string
  }
  geometry: {
    type: 'Polygon'
    coordinates: number[][][]
  }
}

export interface ComfamaParkData {
  entrance: {
    longitude: number
    latitude: number
    name: string
    description: string
  }
  parkAreaGraphic: Graphic
  entranceGraphic: Graphic
}

function isPointFeature(
  feature: GeoJsonPointFeature | GeoJsonPolygonFeature,
): feature is GeoJsonPointFeature {
  return feature.geometry.type === 'Point'
}

function isPolygonFeature(
  feature: GeoJsonPointFeature | GeoJsonPolygonFeature,
): feature is GeoJsonPolygonFeature {
  return feature.geometry.type === 'Polygon'
}

export async function loadComfamaParkData(
  url: string,
): Promise<ComfamaParkData> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`No se pudo cargar el GeoJSON: ${response.statusText}`)
  }

  const collection = (await response.json()) as {
    type: 'FeatureCollection'
    features: Array<GeoJsonPointFeature | GeoJsonPolygonFeature>
  }

  const entranceFeature = collection.features.find(
    (feature) => isPointFeature(feature) && feature.properties.tipo === 'punto_interes',
  )

  const parkFeature = collection.features.find(
    (feature) =>
      isPolygonFeature(feature) && feature.properties.tipo === 'zona_principal',
  )

  if (!entranceFeature || !isPointFeature(entranceFeature)) {
    throw new Error('El GeoJSON no contiene un punto de entrada (punto_interes).')
  }

  if (!parkFeature || !isPolygonFeature(parkFeature)) {
    throw new Error(
      'El GeoJSON no contiene el polígono del parque (zona_principal).',
    )
  }

  const [longitude, latitude] = entranceFeature.geometry.coordinates

  const entranceGraphic = new Graphic({
    geometry: new Point({
      longitude,
      latitude,
      spatialReference: WGS84,
    }),
    symbol: new SimpleMarkerSymbol({
      color: '#dc2626',
      size: 12,
      outline: {
        color: '#ffffff',
        width: 2,
      },
    }),
    attributes: {
      name: entranceFeature.properties.nombre ?? 'Entrada',
      description: entranceFeature.properties.descripcion ?? '',
    },
    popupTemplate: {
      title: '{name}',
      content: '{description}',
    },
  })

  const parkAreaGraphic = new Graphic({
    geometry: new Polygon({
      rings: parkFeature.geometry.coordinates,
      spatialReference: WGS84,
    }),
    symbol: new SimpleFillSymbol({
      color: [34, 197, 94, 0.22],
      outline: {
        color: '#15803d',
        width: 2,
      },
    }),
    attributes: {
      name: parkFeature.properties.nombre ?? 'Parque',
      description: parkFeature.properties.descripcion ?? '',
    },
    popupTemplate: {
      title: '{name}',
      content: '{description}',
    },
  })

  return {
    entrance: {
      longitude,
      latitude,
      name: entranceFeature.properties.nombre ?? 'Entrada Tutucán',
      description: entranceFeature.properties.descripcion ?? '',
    },
    parkAreaGraphic,
    entranceGraphic,
  }
}

# Natural Park GIS PoC

Prueba de concepto de un mapa interactivo para el **Parque Recreativo Comfama Tutucán** (Rionegro, Antioquia). Visualiza el contorno del parque, senderos, puntos de interés, permite activar/desactivar capas, seleccionar elementos con highlight y consultar coordenadas en WGS84 y MAGNA-SIRGAS al hacer clic.

Construido con **Vite**, **React**, **TypeScript** y **ArcGIS Maps SDK for JavaScript** (`@arcgis/core`).

---

## Características

- Mapa base topográfico centrado en la entrada del parque (zoom 16).
- **Basemap + vista 2D/3D:** selector ligero (topo / satélite / híbrido / calles) y toggle MapView ↔ SceneView.
- **4 capas GeoJSON** independientes (una geometría por archivo):
  - `parque.geojson` — polígono del parque
  - `senderos.geojson` — rutas peatonales (Polyline)
  - `infraestructura.geojson` — baños, parqueaderos, etc. (Point + pins Esri)
  - `pois.geojson` — puntos de interés (Point)
- **Interactividad (Nivel 1):** clic en features → highlight + panel React + zoom suave.
- **LayerList (Nivel 2):** widget nativo para encender/apagar capas (esquina superior izquierda).
- **Conversor de coordenadas:** WGS84 (EPSG:4326) y MAGNA-SIRGAS Origen Nacional (EPSG:9377) en cada clic.
- **Clean Architecture:** React no importa `@arcgis/core`.
- **Design system:** UI basada en *Vitality & Social Connection* (magenta `#DB0061`, verde `#008444`, tipografía Plus Jakarta Sans + Source Sans 3).

---

## Requisitos previos

- [Node.js](https://nodejs.org/) 20+
- **API Key** de [ArcGIS Developer](https://developers.arcgis.com/)

---

## Inicio rápido

```bash
git clone <url-del-repo>
cd natural-park-gis-poc
npm install
cp .env.example .env.local
# Editar .env.local → VITE_ARCGIS_API_KEY=tu_api_key
npm run dev
```

Abre `http://localhost:5173`.

---

## Scripts

| Comando           | Descripción                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Servidor de desarrollo         |
| `npm run build`   | TypeScript + build producción  |
| `npm run preview` | Vista previa del build         |
| `npm run lint`    | Oxlint                         |

---

## Estructura del proyecto

```
natural-park-gis-poc/
├── public/data/
│   ├── parque.geojson       # Polygon — contorno del parque
│   ├── senderos.geojson     # LineString — rutas peatonales
│   ├── infraestructura.geojson  # Point — baños, parqueadero, etc.
│   └── pois.geojson         # Point — entrada y POIs
├── src/
│   ├── domain/
│   │   ├── Coordinate.ts    # lat/lng + X/Y
│   │   ├── MapFeature.ts    # feature seleccionado (sin ArcGIS)
│   │   └── IMapService.ts   # contrato del mapa
│   ├── infrastructure/
│   │   ├── ArcGISMapController.ts   # orquestador del mapa
│   │   ├── layers/                  # fábricas GeoJSONLayer
│   │   │   ├── parkLayer.ts
│   │   │   ├── trailsLayer.ts
│   │   │   ├── infrastructureLayer.ts
│   │   │   ├── poiLayer.ts
│   │   │   ├── symbols/esriPins.ts
│   │   │   └── index.ts
│   │   ├── mappers/
│   │   │   └── mapFeatureMapper.ts  # Graphic → MapFeature
│   │   └── widgets/
│   │       └── mapWidgets.ts        # LayerList, highlight, legend
│   └── presentation/
│       ├── MapComponent.tsx
│       ├── CoordinatePanel.tsx
│       └── FeatureDetailPanel.tsx
└── .env.example
```

---

## Arquitectura

```
presentation/          domain/              infrastructure/
─────────────          ───────              ────────────────
MapComponent      →    IMapService     ←    ArcGISMapController
CoordinatePanel        Coordinate            ├── layers/
FeatureDetailPanel     MapFeature            ├── mappers/
                                             └── widgets/
```

### Regla principal

> **Prohibido importar `@arcgis/core` en archivos `.tsx`.**

React recibe datos planos (`Coordinate`, `MapFeature`) vía callbacks. ArcGIS vive solo en `infrastructure/`.

### Flujo de un clic en el mapa

```
Usuario hace clic
       │
       ▼
ArcGISMapController.handleMapClick()
       │
       ├── Siempre → convertCoordinate() → CoordinatePanel (WGS84 + EPSG:9377)
       │
       └── hitTest() — prioridad: POI > infraestructura > sendero > parque
               │
               ├── Sin hit → quita highlight, limpia FeatureDetailPanel
               │
               └── Con hit → highlight + query attributes → FeatureDetailPanel
```

---

## Capas del mapa

| Orden | ID | Archivo | Geometría | Estilo |
| ----- | -- | ------- | --------- | ------ |
| 1 (abajo) | `parque` | `parque.geojson` | Polygon | Verde semitransparente |
| 2 | `senderos` | `senderos.geojson` | LineString | Marrón / azul punteado |
| 3 | `infraestructura` | `infraestructura.geojson` | Point | Pins Esri por `tipo` |
| 4 (arriba) | `pois` | `pois.geojson` | Point | Pins Esri por `categoria` |

### Categorías de POIs (`categoria`)

| Valor | Pin | Contenido |
| ----- | --- | --------- |
| `atraccion` | Rojo | Rueda, Megadrop, Granja, tren, etc. |
| `gastronomia` | Naranja | Doña Rita, Fonda de Suso, artesanías |
| `acuatico` | Azul | Lago, nauticos, piscinas, tobogán |
| `deporte` | Verde | Gimnasio, canchas de tenis |
| `servicio` | Amarillo | Entrada, parqueadero, cajero, instalaciones |

> **Regla ArcGIS:** cada `GeoJSONLayer` admite **un solo tipo de geometría** por archivo.

### Agregar un POI

Edita `public/data/pois.geojson`:

```json
{
  "type": "Feature",
  "properties": {
    "nombre": "La Granja City Farm",
    "categoria": "atraccion",
    "descripcion": "Espacio de interacción con animales."
  },
  "geometry": {
    "type": "Point",
    "coordinates": [-75.382322, 6.138482]
  }
}
```

Campo opcional **`imagen`**: URL de foto del lugar (local en `public/images/` o externa). Se muestra en `FeatureDetailPanel` al seleccionar el elemento.

```json
"imagen": "/images/entrada.jpg"
```

Categorías válidas: `atraccion`, `gastronomia`, `acuatico`, `deporte`, `servicio`.
### Agregar un sendero

Edita `public/data/senderos.geojson` con `LineString` y campos `nombre`, `tipo`, `descripcion`, `distancia_m`.

Tipos de sendero: `sendero_principal`, `acceso_discapacitados`.

### Agregar infraestructura

Edita `public/data/infraestructura.geojson`:

```json
{
  "type": "Feature",
  "properties": {
    "nombre": "Baños zona acuática",
    "tipo": "bano",
    "descripcion": "Servicios sanitarios."
  },
  "geometry": {
    "type": "Point",
    "coordinates": [-75.381200, 6.138500]
  }
}
```

Tipos soportados: `bano`, `parqueadero`, `primeros_auxilios`, `informacion`.

---

## Interactividad implementada

### Nivel 1 — Popups y highlight

- `view.hitTest()` detecta features bajo el cursor (prioriza la capa más específica).
- `layerView.highlight()` resalta la geometría seleccionada.
- `FeatureDetailPanel` (React) muestra nombre, categoría y descripción (popup nativo desactivado para evitar solapes).
- Al seleccionar un POI, la cámara hace `goTo` con animación.
- Etiquetas de nombre visibles al acercar el zoom.
- Leyenda de categorías (widget Expand, esquina inferior derecha).
- **Filtro React por categoría** (`CategoryFilterPanel`): checkboxes que aplican `definitionExpression` sobre la capa de POIs sin saturar el LayerList.
- Popup nativo de ArcGIS desactivado (`view.popupEnabled: false`); el `PopupTemplate` queda definido en la capa por si se rehabilita.

### Nivel 2 — LayerList

- Widget `LayerList` en la esquina superior izquierda.
- Cada capa tiene `title` e `id` para identificación.
- `listMode: 'show'` hace visible la capa en el panel.

---

## Conversión de coordenadas

En **cualquier** clic (feature o mapa vacío):

1. ArcGIS entrega `event.mapPoint`.
2. `projection.project()` → EPSG:4326 (grados).
3. `projection.project()` → EPSG:9377 (metros).

Requiere `@arcgis/core@4.31.6` (`projection.load()` + `projection.project()`).

---

## Variables de entorno

| Variable | Descripción | Obligatoria |
| -------- | ----------- | ----------- |
| `VITE_ARCGIS_API_KEY` | API Key ArcGIS Developer | Sí |

---

## Próximos pasos

- [x] Capa `infraestructura.geojson` (baños, parqueaderos) con pins Esri
- [x] Panel React de filtros por categoría (`CategoryFilterPanel`)
- [ ] Widget Sketch para dibujar y exportar geometrías
- [ ] Heatmap de densidad de visitantes

---

## Stack

- [Vite 8](https://vite.dev/) · [React 19](https://react.dev/) · [TypeScript 6](https://www.typescriptlang.org/)
- [ArcGIS Maps SDK 4.31](https://developers.arcgis.com/javascript/latest/)
- [Oxlint](https://oxc.rs/docs/guide/usage/linter.html)

---

## Licencia

PoC interna / educativa. Ajusta según las políticas de tu organización.

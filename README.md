# Natural Park GIS PoC

Prueba de concepto de un mapa interactivo para la **entrada del Parque Recreativo Comfama Tutucán** (Rionegro, Antioquia). El foco está en visualizar la geometría del parque, marcar el punto de acceso y consultar coordenadas en dos sistemas de referencia al hacer clic en el mapa.

Construido con **Vite**, **React**, **TypeScript** y **ArcGIS Maps SDK for JavaScript** (`@arcgis/core`).

---

## Características

- Mapa base topográfico centrado en la entrada del parque (zoom 17).
- Carga de geometrías desde **GeoJSON** (`public/data/comfama.geojson`):
  - **Punto de entrada** (`punto_interes`) — marcador rojo con popup.
  - **Área del parque** (`zona_principal`) — polígono semitransparente con borde verde.
- **Conversor de coordenadas al clic**:
  - **WGS84** (EPSG:4326) → Latitud / Longitud en grados.
  - **MAGNA-SIRGAS Origen Nacional** (EPSG:9377) → X / Y en metros.
- Arquitectura limpia: la UI de React no importa `@arcgis/core`; toda la lógica GIS vive en infraestructura.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) 20+
- Una **API Key** de ArcGIS Developer. Obtenerla en [developers.arcgis.com](https://developers.arcgis.com/).

---

## Inicio rápido

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd natural-park-gis-poc

# Instalar dependencias
npm install

# Configurar la API key
cp .env.example .env.local
# Editar .env.local y pegar tu clave:
# VITE_ARCGIS_API_KEY=tu_api_key_aqui

# Servidor de desarrollo
npm run dev
```

Abre la URL que muestre Vite (por defecto `http://localhost:5173`).

---

## Scripts disponibles

| Comando           | Descripción                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Servidor de desarrollo con HMR           |
| `npm run build`   | Compilación TypeScript + build de Vite   |
| `npm run preview` | Vista previa del build de producción     |
| `npm run lint`    | Análisis estático con Oxlint             |

---

## Estructura del proyecto

```
natural-park-gis-poc/
├── public/
│   └── data/
│       └── comfama.geojson      # Geometrías del parque (entrada + polígono)
├── src/
│   ├── domain/                  # Entidades y contratos (sin dependencias GIS)
│   │   ├── Coordinate.ts
│   │   └── IMapService.ts
│   ├── infrastructure/          # Integración con ArcGIS y carga de datos
│   │   ├── ArcGISMapController.ts
│   │   └── geoJsonLoader.ts
│   ├── presentation/            # Componentes React (sin @arcgis/core)
│   │   ├── MapComponent.tsx
│   │   └── CoordinatePanel.tsx
│   ├── App.tsx
│   └── main.tsx
├── .env.example
└── package.json
```

---

## Arquitectura

El proyecto sigue **Clean Architecture** con tres capas bien separadas:

```
┌─────────────────────────────────────────────────────────┐
│  presentation/                                          │
│  MapComponent, CoordinatePanel                          │
│  (React puro — sin imports de @arcgis/core)            │
└────────────────────────┬────────────────────────────────┘
                         │ usa IMapService
┌────────────────────────▼────────────────────────────────┐
│  domain/                                                │
│  Coordinate, IMapService                                  │
│  (interfaces y tipos independientes del SDK)            │
└────────────────────────┬────────────────────────────────┘
                         │ implementa
┌────────────────────────▼────────────────────────────────┐
│  infrastructure/                                        │
│  ArcGISMapController, geoJsonLoader                       │
│  (MapView, projection, GraphicsLayer, fetch GeoJSON)    │
└─────────────────────────────────────────────────────────┘
```

### Regla principal

> **Prohibido importar `@arcgis/core` en archivos `.tsx`.**

Los componentes de presentación solo conocen las interfaces del dominio (`IMapService`, `Coordinate`). El controlador de infraestructura encapsula mapa, proyección, eventos de clic y gráficos.

---

## Datos GeoJSON

El archivo `public/data/comfama.geojson` es un `FeatureCollection` con dos features. El loader (`geoJsonLoader.ts`) los identifica por el campo `properties.tipo`:

| `tipo`            | Geometría | Uso en el mapa                          |
| ----------------- | --------- | --------------------------------------- |
| `punto_interes`   | `Point`   | Marcador rojo de la entrada principal   |
| `zona_principal`  | `Polygon` | Contorno del área general del parque    |

### Ejemplo — punto de entrada

```json
{
  "type": "Feature",
  "properties": {
    "nombre": "Entrada Tutucán",
    "tipo": "punto_interes",
    "descripcion": "Acceso principal al parque Comfama por la Calle 38."
  },
  "geometry": {
    "type": "Point",
    "coordinates": [-75.382248, 6.139636]
  }
}
```

> **Importante:** GeoJSON usa el orden **`[longitud, latitud]`**, no al revés.

Para actualizar el mapa, edita o reemplaza `public/data/comfama.geojson` y recarga la aplicación. No hace falta tocar código TypeScript siempre que se respeten los tipos `punto_interes` y `zona_principal`.

---

## Conversión de coordenadas

Al hacer clic en cualquier punto del mapa:

1. ArcGIS devuelve la coordenada del clic en el sistema del mapa.
2. Se proyecta a **WGS84** (EPSG:4326) → se muestran latitud y longitud en grados.
3. Se proyecta a **MAGNA-SIRGAS Origen Nacional** (EPSG:9377) → se muestran X e Y en metros.

La proyección usa `@arcgis/core/geometry/projection` (`projection.load()` al iniciar y `projection.project()` en cada clic). Los resultados se muestran en el panel flotante `CoordinatePanel`.

---

## Variables de entorno

| Variable               | Descripción                          | Obligatoria |
| ---------------------- | ------------------------------------ | ----------- |
| `VITE_ARCGIS_API_KEY`  | API Key de ArcGIS Developer          | Sí          |

Copia `.env.example` a `.env.local` (o `.env`). Vite expone automáticamente las variables con prefijo `VITE_`.

---

## Versión de `@arcgis/core`

El proyecto fija **`@arcgis/core@4.31.6`** de forma intencional. Esta PoC depende del módulo `@arcgis/core/geometry/projection` con las APIs `load()` y `project()`. En versiones más recientes del SDK (5.x) esa API fue reestructurada o removida, por lo que se mantiene la 4.31.x para garantizar la conversión EPSG:4326 → EPSG:9377.

---

## Stack tecnológico

- [Vite 8](https://vite.dev/) — bundler y dev server
- [React 19](https://react.dev/) — UI
- [TypeScript 6](https://www.typescriptlang.org/) — tipado estático
- [ArcGIS Maps SDK 4.31](https://developers.arcgis.com/javascript/latest/) — mapa, geometrías y proyección
- [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) — linting

---

## Próximos pasos (ideas)

- Añadir más capas GeoJSON (senderos, zonas acuáticas, POIs).
- Centrar el mapa con `view.goTo(polygon.extent)` para encuadrar todo el parque.
- Sustituir `GraphicsLayer` por `GeoJSONLayer` si crece el volumen de datos.
- Desplegar en Vercel, Netlify o similar con la API key en variables de entorno.

---

## Licencia

PoC interna / educativa. Ajusta la licencia según las políticas de tu organización.

# Contexto del Proyecto — Natural Park GIS PoC (Investigación B)

> Documento de traspaso. Resume qué es el proyecto, qué se hizo en esta sesión,
> el estado actual, decisiones tomadas y pendientes. Pensado para continuar el
> trabajo en otro chat/sesión sin perder contexto.

---

## 1. Qué es el proyecto

Prueba de concepto (PoC) de un **mapa interactivo del Parque Recreativo Comfama
Tutucán** (Rionegro, Antioquia, Colombia).

**Stack:** Vite 8 + React 19 + TypeScript 6 + ArcGIS Maps SDK for JavaScript
(`@arcgis/core@4.31.6`). Linter: Oxlint. Gestor: npm.

**Arquitectura:** Clean Architecture con regla estricta:
> **Prohibido importar `@arcgis/core` en archivos `.tsx`.**
> ArcGIS vive solo en `src/infrastructure/`. React (`presentation/`) recibe
> datos planos vía callbacks. El dominio (`domain/`) define contratos
> (p.ej. `IMapService`) y tipos sin dependencias de ArcGIS.

**Repositorio:** GitHub `ElDaiko/arcgis-park-poc.git`
**Rama de trabajo:** `investigacion-b-webmap` (pusheada al remoto)
**Último commit:** `bf699ea` ("Add styled Web Map tab and PDF reports")

---

## 2. El objetivo de la investigación

Comparar formas de servir el mapa y demostrar que **el front mantiene el
control de la presentación** aunque los datos vivan en la nube:

- **Investigación A:** datos alojados en ArcGIS Online (AGOL), mapa armado en
  código.
- **Investigación B (la que se trabajó):** datos **y** mapa (Web Map) en AGOL,
  consumidos por el front, que además puede sobrescribir estilos e
  interactividad en tiempo de ejecución.

Pregunta central respondida: *¿puedo tener la fuente de verdad en AGOL sin
perder control del front?* → **Sí.**

---

## 3. Las 4 pestañas (TabBar) y qué resuelve cada una

| # | Tab | Fuente de datos | Qué demuestra |
|---|-----|-----------------|---------------|
| 1 | 🗺 **Mapa del Parque** | GeoJSON **local** (`public/data/*.geojson`) | Línea base: estilo + interactividad 100% en código. Capas: parque (polígono), senderos (líneas), infraestructura (puntos), POIs (puntos). hitTest, highlight, panel de detalle, coordenadas WGS84/MAGNA-SIRGAS, filtro por categoría, 2D/3D, basemap gallery. |
| 2 | 📊 **Análisis de Densidad** | `public/data/densidad-parques.geojson` | Visualización analítica: **extrusión 3D** por celdas de grilla (SceneView). Campos: `aforo_actual`, `indice_densidad`. 35 celdas, 5 zonas. |
| 3 | ☁️ **Web Map (AGOL)** | **Web Map alojado en AGOL** (por item ID) | Datos + configuración (estilos, popups, basemap, extent) viven en la nube. El front solo aporta el item ID. Estilo **por defecto de AGOL**. |
| 4 | 🎨 **Web Map + estilo local** | **Mismo Web Map de AGOL** | **Punto central:** el front **sobrescribe** renderers, labels e interactividad para igualar la pestaña 1. Datos en AGOL + presentación controlada por el front. |

Pestañas **2 y 4** incluyen botón **"Descargar informe PDF"**.

---

## 4. Recursos en ArcGIS Online (AGOL / Location Platform)

**Cuenta:** ArcGIS **Location Platform** (variante para desarrolladores),
usuario `Miguelr41`, portal `mroldan-dev.maps.arcgis.com`.

**Web Map:**
- Título: `tutucan`
- **Item ID: `8d1123f4d39547e7b2ab47345f3ce711`**
- Acceso: **público**

**4 Feature Layers (hosted)** — en `services8.arcgis.com/GbbKdmHXK5vlFjEU`:
| Título en AGOL | Geometría | FeatureServer |
|----------------|-----------|---------------|
| `parque` | Polygon | `/parque/FeatureServer/0` |
| `senderos` | Polyline | `/senderos/FeatureServer/0` |
| `infraestructura` | Point | `/infraestructura/FeatureServer/0` |
| `Punto de Interes` | Point | `/Punto_de_Interes/FeatureServer/0` |

> Nota: las capas son **privadas**. El acceso se logra vía la **API key** (item
> access), no por compartición pública. El rol de la cuenta no permite compartir
> públicamente feature layers.

**API Key credential:** item `arcgis-poc` (Application).
- Tiene **item access** a las 4 Feature Layers (configurado explícitamente).
- Tiene **referrer** restringido a `http://localhost:5173`.
- ⚠️ La API key **viaja al navegador** (app cliente). Su protección es el
  **referrer**, no ocultarla.

---

## 5. Archivos clave creados/modificados en esta sesión

### Investigación B — Web Map básico (pestaña 3)
- `src/infrastructure/WebMapController.ts` — carga el Web Map por item ID,
  añade LayerList + Legend, reporta a React las capas cargadas. No usa
  `@arcgis/core` en React.
- `src/presentation/WebMapPage.tsx` — página React de la pestaña 3.

### Investigación B — Web Map estilizado + interactivo (pestaña 4)
- `src/infrastructure/webmap/localStyleRenderers.ts` — replica los renderers
  locales (parque magenta `#db0061`, senderos verdes por `tipo`, pins por
  `tipo`/`categoria`). `prepareWebMapLayer()` hace 3 cosas por capa del Web Map:
  (1) aplica renderer local, (2) normaliza el `id` al canónico
  (`parque`/`senderos`/`infraestructura`/`pois`) para reutilizar hitTest/filtros,
  (3) desactiva popup nativo. También aplica `labelingInfo` (nombres) a POIs.
- `src/infrastructure/StyledWebMapController.ts` — implementa `IMapService`
  (mismo contrato que `ArcGISMapController`). Carga el Web Map, prepara capas,
  y porta TODA la interactividad reutilizando los módulos existentes:
  `pickBestGraphicHit`, `highlightGraphic`, `toMapFeature`,
  `buildPoiCategoryExpression`, conversión de coordenadas. El toggle 2D/3D es
  no-op en esta pestaña. Tiene `downloadReport()`.
- `src/presentation/StyledWebMapPage.tsx` — monta el controller como
  `IMapService` y reutiliza los paneles del mapa del parque
  (`CategoryFilterPanel`, `CoordinatePanel`, `FeatureDetailPanel`,
  `MapControlsPanel`). Botón flotante de descarga PDF.

### Informes PDF (pestañas 2 y 4)
- `src/infrastructure/reports/densityReportData.ts` — agrega KPIs (aforo total
  ~3833, capacidad 6889, ocupación ~55.6%), desglose por zona, top 10 celdas
  críticas por índice.
- `src/infrastructure/reports/webMapReportData.ts` — conteos por capa, POIs por
  categoría, listado de POIs.
- `src/infrastructure/reports/pdfReport.ts` — genera el PDF con `jspdf` +
  `jspdf-autotable`: encabezado de marca, tarjetas KPI, captura del mapa
  (`view.takeScreenshot`), tablas. Dos funciones: `generateDensityReport` y
  `generateWebMapReport`.
- `downloadReport()` añadido a `DensityMapController` y `StyledWebMapController`.
- Botones + CSS (`.report-download-btn`) en `DensityMapPage`, `StyledWebMapPage`
  y `App.css`.

### Navegación
- `src/presentation/TabBar.tsx` — `AppPage` = `'map' | 'density' | 'webmap' | 'webmap-styled'`.
- `src/App.tsx` — montaje lazy de las 4 páginas.

### Config / dependencias
- `.env.example` — documenta `VITE_ARCGIS_API_KEY` y `VITE_WEBMAP_ITEM_ID`.
- `package.json` — añadidas `jspdf@4.2.1` y `jspdf-autotable@5.0.8` (pinneadas).

### Variables de entorno (`.env.local`, NO versionado)
```
VITE_ARCGIS_API_KEY=<tu_api_key>
VITE_WEBMAP_ITEM_ID=8d1123f4d39547e7b2ab47345f3ce711
```

---

## 6. Decisiones técnicas importantes (y por qué)

1. **Estilos del mapa en renderers (JS), no CSS.** Las geometrías del mapa se
   dibujan en **WebGL (canvas)**, no en DOM; el CSS no las alcanza. Solo la UI
   alrededor (paneles/modales/tabs) usa CSS. El `FeatureDetailPanel` es un
   componente React con CSS (no el popup nativo de ArcGIS, que está desactivado).
2. **CSS actual:** CSS global plano (`App.css`, `index.css`, `styles/tokens.css`
   con variables). No usa SCSS ni CSS Modules (quedó como posible refactor
   futuro, no hecho).
3. **Reutilización por id canónico:** se normaliza el `id` de las capas del Web
   Map para reutilizar la lógica de hitTest/filtros local sin duplicar.
4. **Acceso a capas privadas vía API key item access**, no compartición pública
   (limitación del rol de la cuenta Location Platform).
5. **Git worktrees:** el trabajo se hizo en el worktree
   `/Users/miguel.roldan/.warp/worktrees/natural-park-gis-poc/malpais-equinox`
   (rama `investigacion-b-webmap`). Existe otro worktree en
   `/Users/miguel.roldan/Projects/natural-park-gis-poc` (rama `malpais-equinox`).

---

## 7. Despliegue (en curso — Vercel)

Objetivo: URL pública para que el equipo vea la app.

**Pasos:**
1. Importar repo `ElDaiko/arcgis-park-poc` en Vercel (detecta Vite).
2. **Production Branch** → `investigacion-b-webmap` (o merge a main).
3. **Variables de entorno** (tipo **Config**, NO Secret — porque `VITE_` las
   expone al navegador por diseño; marcar environments **Production + Preview**):
   - `VITE_ARCGIS_API_KEY`
   - `VITE_WEBMAP_ITEM_ID = 8d1123f4d39547e7b2ab47345f3ce711`
4. Deploy → URL tipo `https://arcgis-park-poc.vercel.app`.
5. ⚠️ **CRÍTICO — referrer:** agregar el dominio de Vercel
   (`https://*.vercel.app`) a los **referrers** de la API key en AGOL
   (`arcgis-poc → Configuración → Application → Editar → URL de referencia`),
   y **regenerar la API key**. Actualizar la variable en Vercel y redesplegar.
   Sin esto, el mapa carga en blanco.

**Estado:** se estaban configurando las variables en Vercel. Pendiente:
confirmar environments de `VITE_ARCGIS_API_KEY` (Production + Preview),
desplegar, y hacer el ajuste del referrer.

---

## 8. Pendientes / próximos pasos

- [ ] **Terminar deploy en Vercel** y hacer el ajuste del **referrer** en AGOL.
- [ ] **Verificar visualmente** la pestaña 4: confirmar que los **nombres
      (labels) de POIs** ya se ven (se añadió el fix de `labelingInfo`).
- [ ] **Imágenes de POIs en pestaña 4:** el campo `imagen` existe en AGOL con
      rutas `/images/*.png` (sirven desde `public/images/`). Quedó pendiente
      confirmar en consola/network si cargan en producción (en local el dev
      server las sirve). Archivos existentes: `avion-icaro.png`, `entrada.png`,
      `parque.png` + varios `.svg`.
- [ ] (Opcional) Regenerar la API key: quedó **expuesta en capturas de
      pantalla** compartidas durante la sesión. Mitigado por el referrer, pero
      conviene rotarla.
- [ ] (Opcional) Migrar UI a **CSS Modules o SCSS** (refactor de presentación).
- [ ] (Opcional) Mergear `investigacion-b-webmap` a `main` si se adopta.

---

## 9. Comandos útiles

```bash
# Clonar y correr
git clone https://github.com/ElDaiko/arcgis-park-poc.git
cd arcgis-park-poc
git checkout investigacion-b-webmap
npm install
cp .env.example .env.local   # rellenar VITE_ARCGIS_API_KEY y VITE_WEBMAP_ITEM_ID
npm run dev                  # http://localhost:5173

# Verificación
npm run build                # tsc -b + vite build
npm run lint                 # oxlint

# Verificar acceso a capas (requiere header Referer)
curl -s -H "Referer: http://localhost:5173" \
  "https://services8.arcgis.com/GbbKdmHXK5vlFjEU/arcgis/rest/services/parque/FeatureServer/0?f=json&token=TU_API_KEY"
```

---

## 10. Estado de verificación (última sesión)

- ✅ `npm run build` (tsc + vite) exitoso.
- ✅ `npm run lint` (oxlint) — 0 errores, 0 warnings (36 archivos).
- ✅ Código commiteado y pusheado a `investigacion-b-webmap` (`bf699ea`).
- ✅ Web Map público y 4 capas accesibles vía API key (verificado con curl +
      header Referer → responden OK).
- ⏳ Prueba visual de labels/imágenes en pestaña 4 y deploy Vercel: pendientes.

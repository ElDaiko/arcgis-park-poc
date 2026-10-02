/** Variables de entorno de la app (Vite las inyecta en build; ver .env.example). */
export const appConfig = {
  arcgisApiKey: import.meta.env.VITE_ARCGIS_API_KEY ?? '',
  webMapItemId: import.meta.env.VITE_WEBMAP_ITEM_ID ?? '',
} as const

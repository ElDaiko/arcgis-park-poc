import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // ArcGIS ya tiene su propio sistema de módulos optimizado; excluirlo evita
    // que Vite lo pre-bundlee innecesariamente, acortando el cold start.
    exclude: ['@arcgis/core'],
  },
})

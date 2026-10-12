import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Agrega este bloque para solucionar el error de SockJS
  define: {
    global: 'window',
  },
  server: {
    port: 3000,
    host: true, 
    proxy: {
      '/api/logistica': {
        target: 'http://localhost:8080', // (O http://logistica-api:8080 si usas Docker)
        changeOrigin: true,
      },
      '/api/aduana': {
        target: 'http://localhost:8082', // (O http://aduana-api:8082 si usas Docker)
        changeOrigin: true,
      }
    }
  }
})
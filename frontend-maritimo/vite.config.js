import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, 
    proxy: {
      '/api/logistica': {
        target: 'http://logistica-api:8080', 
        changeOrigin: true,
      },
      '/api/aduana': {
        target: 'http://aduana-api:8082',
        changeOrigin: true,
      }
    }
  }
})
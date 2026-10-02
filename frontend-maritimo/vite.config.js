import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Todo lo que empiece con /api/logistica se va al puerto 8080
      '/api/logistica': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Todo lo que empiece con /api/aduana se va al puerto 8082
      '/api/aduana': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      }
    }
  }
})
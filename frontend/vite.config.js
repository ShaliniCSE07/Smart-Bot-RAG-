import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy all backend API calls to FastAPI on 127.0.0.1:8000
      // This eliminates CORS — the browser sees same-origin requests
      '/upload':    { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/chat':      { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/documents': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/health':    { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/api':       { target: 'http://127.0.0.1:8000', changeOrigin: true },
    }
  }
})

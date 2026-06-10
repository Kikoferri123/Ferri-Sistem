import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8000',
      '/properties': 'http://localhost:8000',
      '/clients': 'http://localhost:8000',
      '/transactions': 'http://localhost:8000',
      '/contracts': 'http://localhost:8000',
      '/dashboard': 'http://localhost:8000',
      '/alerts': 'http://localhost:8000',
      '/settings': 'http://localhost:8000',
      '/rooms': 'http://localhost:8000',
      '/documents': 'http://localhost:8000',
      '/uploads': 'http://localhost:8000',
      '/payments': 'http://localhost:8000',
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// В деве фронт (5173) проксирует /api и /ws на бэкенд (8000),
// поэтому в коде можно обращаться к относительным путям без CORS-хлопот.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/ws': { target: 'ws://localhost:8000', ws: true },
    },
  },
})

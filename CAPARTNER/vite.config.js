import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Forward /api/... to the CAPartner backend, so the browser never calls another address directly.
// Used by both "npm run dev" and "npm run preview" (the built app).
const apiProxy = {
  '/api': {
    target: 'http://localhost:3000',
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
})
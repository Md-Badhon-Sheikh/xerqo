import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// API requests to /api (and uploaded files under /storage) are proxied to the Laravel backend during development.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // /storage: images uploaded in Admin › Pages are saved as "/storage/content/…" (same domain on the live site)
    proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true }, '/storage': { target: 'http://127.0.0.1:8000', changeOrigin: true } },
  },
})

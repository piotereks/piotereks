import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/piotereks/html/esp_react/', 
  build: {
    outDir: '../docs/html/esp_react',
    emptyOutDir: true,
  }
})

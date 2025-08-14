import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.d.ts', '.jsx', '.tsx', '.json'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    preserveSymlinks: true
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4004',
        changeOrigin: true,
        ws: true
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})

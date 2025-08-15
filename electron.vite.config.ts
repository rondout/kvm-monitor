import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
// @ts-ignore
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:4004',
          changeOrigin: true,
          ws: true
          // rewrite: (path) => path.replace(/^\/api/, '')
        },
        '/kvm-api': {
          target: 'http://localhost:4004',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace('/kvm-api', '/kvm-api')
        }
      }
    }
  }
})

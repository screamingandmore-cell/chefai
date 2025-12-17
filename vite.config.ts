
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig(({ mode }) => {
  const root = process.cwd();
  const env = loadEnv(mode, root, '');

  return {
    resolve: {
      alias: {
        '@': path.resolve(root, '.')
      }
    },
    plugins: [
      react(),
      VitePWA({
        strategies: 'generateSW',
        filename: 'sw.js',
        registerType: 'autoUpdate',
        manifest: false,
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,json}'],
          cleanupOutdatedCaches: true
        }
      })
    ],
    define: {
      'process.env': env
    }
  }
})

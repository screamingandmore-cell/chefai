
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.js',
        registerType: 'autoUpdate',
        injectRegister: null, // Registro manual no index.html
        manifest: false, // Usa o arquivo manual public/manifest.json
        devOptions: {
          enabled: true,
          type: 'module',
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true
        },
        includeAssets: [
          'favicon.svg', 
          'icon-192.png', 
          'icon-512.png',
          'screenshot-mobile-1.png',
          'screenshot-mobile-2.png',
          'screenshot-mobile-3.png',
          'screenshot-desktop-1.png',
          'screenshot-desktop-2.png',
          'screenshot-desktop-3.png'
        ]
      })
    ],
    define: {
      'process.env': env
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets'
    }
  }
})

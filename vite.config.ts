
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
        strategies: 'generateSW', // GERA AUTOMATICAMENTE (Não precisa de src/sw.js)
        outDir: 'dist',
        filename: 'sw.js', // Nome fixo padrão
        registerType: 'autoUpdate',
        injectRegister: null, // Vamos registrar manualmente no index.html para garantir
        manifest: false, // Usa o arquivo manual de public/manifest.json
        devOptions: {
          enabled: true,
          type: 'module',
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
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

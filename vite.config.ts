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
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        // Usamos false aqui para ele respeitar o arquivo public/manifest.json manual
        manifest: false, 
        includeAssets: [
            'favicon.svg', 
            'icon-192.png', 
            'icon-512.png', 
            'robots.txt', 
            'apple-touch-icon.png',
            'screenshot-mobile-1.png',
            'screenshot-mobile-2.png',
            'screenshot-mobile-3.png',
            'screenshot-desktop-1.png',
            'screenshot-desktop-2.png',
            'screenshot-desktop-3.png'
        ],
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
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    define: {
      'process.env': env
    }
  }
})
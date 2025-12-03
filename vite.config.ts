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
        // Importante: incluir os screenshots na lista de assets para o SW cachear
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
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 365 dias
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        // Mantemos a configuração aqui também para garantir redundância
        manifest: {
          id: 'com.chefai.app',
          name: 'Chef.ai - Cardápios Inteligentes',
          short_name: 'Chef.ai',
          description: 'Seu assistente de cozinha pessoal com Inteligência Artificial.',
          theme_color: '#10b981',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          categories: ['food', 'lifestyle', 'productivity', 'health'],
          lang: 'pt-BR',
          dir: 'ltr',
          prefer_related_applications: false,
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
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
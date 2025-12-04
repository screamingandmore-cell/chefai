import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Forçar inclusão de assets para evitar erro 404
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.svg', '**/*.ico'],
    
    plugins: [
      react(),
      VitePWA({
        strategies: 'generateSW',
        filename: 'sw.js', // CORRIGIDO: Nome padrão para evitar erro 404
        registerType: 'autoUpdate',
        injectRegister: null, // Registro manual no index.html
        manifest: false, // Usa o arquivo manual public/manifest.json
        devOptions: {
          enabled: true,
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,json}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: '/index.html',
          // Não redirecionar imagens para o index.html
          navigateFallbackDenylist: [
            /^\/.*\.png$/, 
            /^\/.*\.jpg$/,
            /^\/.*\.jpeg$/,
            /^\/.*\.json$/, 
            /^\/sw.js$/
          ],
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
          'pwa-shot-1.png', 'pwa-shot-2.png', 'pwa-shot-3.png',
          'pwa-shot-4.png', 'pwa-shot-5.png', 'pwa-shot-6.png'
        ]
      })
    ],
    define: {
      'process.env': env
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            utils: ['@supabase/supabase-js', 'openai']
          }
        }
      }
    }
  }
})
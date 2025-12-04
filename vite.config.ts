import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Forçar inclusão de PNGs
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.svg', '**/*.ico'],
    
    plugins: [
      react(),
      VitePWA({
        strategies: 'generateSW', // Modo automático mais robusto
        filename: 'sw.js', 
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
          // Impedir que o SW intercepte imagens e retorne HTML
          navigateFallbackDenylist: [
            /^\/.*\.png$/, 
            /^\/.*\.jpg$/,
            /^\/.*\.jpeg$/,
            /^\/.*\.json$/, 
            /^\/sw.js$/
          ]
        },
        includeAssets: [
          'favicon.svg', 
          'icon-192.png', 
          'icon-512.png',
          // LISTA DE PNGs
          'pwa-shot-1.png',
          'pwa-shot-2.png',
          'pwa-shot-3.png',
          'pwa-shot-4.png',
          'pwa-shot-5.png',
          'pwa-shot-6.png'
        ]
      })
    ],
    define: {
      'process.env': env
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true
    }
  }
})
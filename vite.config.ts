import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.svg', '**/*.ico'],
    
    plugins: [
      react(),
      VitePWA({
        strategies: 'generateSW',
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
          'pwa-shot-1.jpg',
          'pwa-shot-2.jpg',
          'pwa-shot-3.jpg',
          'pwa-shot-4.jpg',
          'pwa-shot-5.jpg',
          'pwa-shot-6.jpg'
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
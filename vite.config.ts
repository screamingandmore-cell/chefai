import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        // 'generateSW' é o padrão quando não definimos 'strategies'.
        // Isso cria o sw.js automaticamente na raiz sem precisar de arquivo fonte.
        manifest: false, // Usa o arquivo manual public/manifest.json
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          maximumFileSizeToCacheInBytes: 5000000, // Aumenta limite para 5MB para evitar avisos
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
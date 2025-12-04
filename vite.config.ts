import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.svg'],
    plugins: [
      react(),
      VitePWA({
        strategies: 'generateSW',
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: false, // Usa o arquivo manual public/manifest.json
        devOptions: {
          enabled: true,
          type: 'module',
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          maximumFileSizeToCacheInBytes: 5000000,
          // Ignora query params para garantir que o SW funcione em qualquer rota
          ignoreURLParametersMatching: [/^utm_/, /^fbclid$/]
        },
        includeAssets: [
          'favicon.svg', 
          'icon-192.png', 
          'icon-512.png',
          'cell1.png',
          'cell2.png',
          'cell3.png',
          'pc1.png',
          'pc2.png',
          'pc3.png'
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
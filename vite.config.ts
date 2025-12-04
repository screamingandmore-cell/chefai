import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    publicDir: 'public',
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.svg'],
    plugins: [
      react(),
      VitePWA({
        strategies: 'generateSW', // MUDANÇA: Gera automaticamente sem precisar de arquivo fonte
        registerType: 'autoUpdate',
        injectRegister: null, // Usa o script manual do index.html
        manifest: false, // Usa o manifesto manual de public/manifest.json
        devOptions: {
          enabled: true,
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: '/index.html', // Garante funcionamento offline para SPA
        },
        includeAssets: [
          'favicon.svg', 
          'icon-192.png', 
          'icon-512.png',
          'cell1.png', 'cell2.png', 'cell3.png',
          'pc1.png', 'pc2.png', 'pc3.png'
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
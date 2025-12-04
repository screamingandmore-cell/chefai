import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Força o Vite a tratar PNGs como arquivos estáticos (evita 404)
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.svg'],
    
    plugins: [
      react(),
      VitePWA({
        strategies: 'generateSW', // Estratégia automática e robusta
        registerType: 'autoUpdate',
        injectRegister: 'auto',   // Deixa o plugin injetar o registro no HTML
        manifest: false,          // Respeita o arquivo manual public/manifest.json
        devOptions: {
          enabled: true,
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: '/index.html',
          // Não redirecionar imagens para o index.html (corrige erro de text/html)
          navigateFallbackDenylist: [/^\/.*\.png$/, /^\/.*\.json$/]
        },
        // Lista explícita de arquivos para o Service Worker cachear
        includeAssets: [
          'favicon.svg', 
          'icon-192.png', 
          'icon-512.png',
          'screen-1.png', 'screen-2.png', 'screen-3.png',
          'screen-4.png', 'screen-5.png', 'screen-6.png'
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
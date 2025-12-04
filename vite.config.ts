import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Força o Vite a aceitar imagens como arquivos estáticos
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.svg', '**/*.ico'],
    
    plugins: [
      react(),
      VitePWA({
        strategies: 'generateSW', // Gera o arquivo automaticamente
        filename: 'sw.js', // Nome padrão universal
        registerType: 'autoUpdate',
        injectRegister: null, // DESLIGADO: Vamos registrar manualmente no index.html
        manifest: false, // Usa o arquivo manual public/manifest.json
        devOptions: {
          enabled: true,
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [
            /^\/.*\.png$/, 
            /^\/.*\.json$/, 
            /^\/.*\.jpg$/,
            /^\/sw.js$/
          ]
        }
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
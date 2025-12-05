import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // Fix: Cast process to any to avoid "Property 'cwd' does not exist on type 'Process'" error
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.svg', '**/*.ico'],
    
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
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,json}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          // Regra crucial: Não interceptar imagens
          navigateFallbackDenylist: [
            /^\/.*\.png$/,
            /^\/.*\.jpg$/,
            /^\/.*\.json$/,
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
      emptyOutDir: true,
      sourcemap: false
    }
  }
})
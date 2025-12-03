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
        injectRegister: null, // Desativa injeção automática para usarmos o script manual no index.html
        strategies: 'generateSW', // O sistema gera o arquivo sozinho, sem precisar de src/sw.js
        filename: 'sw.js', // Nome padrão universal
        manifest: false, // Usa o arquivo public/manifest.json que já configuramos
        devOptions: {
          enabled: true,
          type: 'module',
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true
        },
        includeAssets: [
            'favicon.svg', 
            'icon-192.png', 
            'icon-512.png', 
            'robots.txt', 
            'apple-touch-icon.png',
            'screenshot-*.png'
        ]
      })
    ],
    define: {
      'process.env': env
    }
  }
})
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    publicDir: 'public', // Garante que a pasta public seja usada
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.svg'], // Força inclusão de imagens
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.js',
        registerType: 'autoUpdate',
        injectRegister: null,
        manifest: false, 
        devOptions: {
          enabled: true,
          type: 'module',
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

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
        devOptions: {
          enabled: true,
          type: 'module',
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true
        },
        manifest: {
          id: '/',
          name: 'Chef.ai - Cardápios Inteligentes',
          short_name: 'Chef.ai',
          description: 'Seu assistente de cozinha pessoal com Inteligência Artificial. Crie receitas, cardápios e economize.',
          theme_color: '#10b981',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          categories: ['food', 'lifestyle', 'productivity', 'health'],
          lang: 'pt-BR',
          dir: 'ltr',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ],
          screenshots: [
            {
              src: '/screenshot-mobile-1.png',
              sizes: '1080x1920',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Tela Inicial'
            },
            {
              src: '/screenshot-mobile-2.png',
              sizes: '1080x1920',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Geladeira Inteligente'
            },
            {
              src: '/screenshot-mobile-3.png',
              sizes: '1080x1920',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Cardápio Semanal'
            },
            {
              src: '/screenshot-desktop-1.png',
              sizes: '1920x1080',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Visão Geral Desktop'
            },
            {
              src: '/screenshot-desktop-2.png',
              sizes: '1920x1080',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Planejamento Desktop'
            },
            {
              src: '/screenshot-desktop-3.png',
              sizes: '1920x1080',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Receitas Desktop'
            }
          ],
          shortcuts: [
            {
              name: "Abrir Geladeira",
              short_name: "Geladeira",
              description: "Adicionar ingredientes",
              url: "/",
              icons: [{ src: "/icon-192.png", sizes: "192x192" }]
            }
          ]
        }
      })
    ],
    define: {
      'process.env': env
    }
  }
})

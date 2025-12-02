import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente do arquivo .env
  // Fix: Cast process to any to fix 'cwd' missing on type 'Process'
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Permite acessar process.env no código client-side para compatibilidade
      'process.env': env
    }
  }
})
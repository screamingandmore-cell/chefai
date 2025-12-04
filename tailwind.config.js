/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        chef: {
          // Cores ajustadas para passar no teste de contraste WCAG AA/AAA
          // Verde escurecido para #047857 (Emerald 700) para garantir leitura de texto branco
          green: '#047857', 
          // Laranja escurecido para #c2410c (Orange 700) para garantir contraste suficiente
          orange: '#c2410c', 
        }
      }
    },
  },
  plugins: [],
}
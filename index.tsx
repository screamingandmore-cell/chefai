
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; 
import App from './App';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

/**
 * BRIDGE DE AMBIENTE (CTO FIX):
 * O SDK do Gemini exige 'process.env.API_KEY'. 
 * Em ambientes Vite (localhost), o 'process' não existe.
 * Este bloco garante a compatibilidade mapeando suas chaves do .env.
 */
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { 
    env: { 
      // Mapeia tanto a chave correta quanto o possível erro de digitação mencionado
      API_KEY: (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KE 
    } 
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Elemento root não encontrado");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

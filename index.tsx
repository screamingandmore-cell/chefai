import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; 
import App from './App';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

/**
 * BRIDGE DE AMBIENTE (CTO FIX):
 * O SDK do Gemini exige 'process.env.API_KEY'. 
 * Mapeamos as chaves do seu .env (incluindo erros de digitação e chaves de imagem).
 */
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { 
    env: { 
      API_KEY: (import.meta as any).env.VITE_GEMINI_API_KEY || 
               (import.meta as any).env.VITE_GEMINI_API_KE || 
               (import.meta as any).env.VITE_GEMINI_API_KEY_IMAGE 
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
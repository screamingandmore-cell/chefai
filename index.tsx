
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; 
import App from './App';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

/**
 * BRIDGE DE AMBIENTE (PROD FIX):
 * O SDK do Gemini exige 'process.env.API_KEY'. 
 * Em produção (Vercel), garantimos que o objeto global seja injetado corretamente.
 */
const env = (import.meta as any).env;
const apiKey = env.VITE_GEMINI_API_KEY || env.VITE_GEMINI_API_KE;

if (typeof window !== 'undefined') {
  const g = window as any;
  if (!g.process) g.process = { env: {} };
  if (!g.process.env) g.process.env = {};
  // Forçamos a chave no objeto que o SDK consulta internamente
  g.process.env.API_KEY = apiKey;
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

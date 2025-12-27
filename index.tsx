import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; 
import App from './App';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

// Bridge entre Vite env e process.env exigido pela SDK do Google
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || {};
  (window as any).process.env = (window as any).process.env || {};
  
  // Mapeia a chave do Vite para o padrão esperado pela biblioteca @google/genai
  (window as any).process.env.API_KEY = import.meta.env.VITE_GEMINI_API_KEY || (window as any).process.env.API_KEY;
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
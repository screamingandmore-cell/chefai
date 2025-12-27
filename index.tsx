
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; 
import App from './App';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

// Fix: Removed prohibited bridge logic that defines process.env.
// The SDK's access to process.env.API_KEY is handled externally as a hard requirement.

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

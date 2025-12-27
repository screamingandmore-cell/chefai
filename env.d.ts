/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Suas variáveis existentes
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_STRIPE_PUBLIC_KEY: string;
  readonly VITE_STRIPE_PRICE_MONTHLY: string;
  readonly VITE_STRIPE_PRICE_QUARTERLY: string;
  readonly VITE_STRIPE_PRICE_ANNUAL: string;
  readonly VITE_STRIPE_PORTAL_URL: string;
  readonly VITE_ADSENSE_ID: string;

  // --- ADICIONADO: As chaves do Gemini ---
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_GEMINI_API_KEY_IMAGE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
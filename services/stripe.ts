
import { SubscriptionPlan } from "../types";

// Configuração de Chave Pública (caso necessário para loadStripe no futuro)
export const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Configuração de Links de Pagamento Direto (Stripe Payment Links)
const PAYMENT_LINKS = {
  monthly: import.meta.env.VITE_STRIPE_PRICE_MONTHLY,
  quarterly: import.meta.env.VITE_STRIPE_PRICE_QUARTERLY,
  annual: import.meta.env.VITE_STRIPE_PRICE_ANNUAL,
};

export const STRIPE_PORTAL_URL = import.meta.env.VITE_STRIPE_PORTAL_URL;

export const PLANS: SubscriptionPlan[] = [
  { id: 'monthly', name: 'Mensal', price: 9.90, interval: 'mês' },
  { id: 'quarterly', name: 'Trimestral', price: 26.90, interval: '3 meses', savings: '10%' },
  { id: 'annual', name: 'Anual', price: 99.90, interval: 'ano', savings: '20%' },
];

export const initiateCheckout = async (planId: string, userEmail?: string): Promise<boolean> => {
  try {
    const paymentUrl = PAYMENT_LINKS[planId as keyof typeof PAYMENT_LINKS];

    if (!paymentUrl) {
      alert(`Erro: Link para o plano '${planId}' não configurado no .env (VITE_STRIPE_PRICE_...)`);
      return false;
    }

    const finalUrl = new URL(paymentUrl);
    if (userEmail) {
      finalUrl.searchParams.append('prefilled_email', userEmail);
    }
    
    window.location.href = finalUrl.toString();
    return true; 
  } catch (err: any) {
    console.error("Stripe Error:", err);
    alert(`Erro ao redirecionar: ${err.message || err}`);
    return false;
  }
};

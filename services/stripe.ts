import { SubscriptionPlan } from "../types";

// Configuração de Links de Pagamento Direto (Payment Links)
const PAYMENT_LINKS = {
monthly: process.env.VITE_STRIPE_PRICE_MONTHLY,
quarterly: process.env.VITE_STRIPE_PRICE_QUARTERLY,
annual: process.env.VITE_STRIPE_PRICE_ANNUAL,
};

export const PLANS: SubscriptionPlan[] = [
{ id: 'monthly', name: 'Mensal', price: 9.90, interval: 'mês' },
{ id: 'quarterly', name: 'Trimestral', price: 26.90, interval: '3 meses', savings: '10%' },
{ id: 'annual', name: 'Anual', price: 99.90, interval: 'ano', savings: '20%' },
];

// Gera apenas a string da URL para usar em tags <a href>
export const getPaymentLink = (planId: string, userEmail?: string): string => {
  const paymentUrl = PAYMENT_LINKS[planId as keyof typeof PAYMENT_LINKS];

  // Validações básicas
  if (!paymentUrl) return '#error-config';
  if (!paymentUrl.startsWith('http')) return '#error-format';

  try {
    const finalUrl = new URL(paymentUrl);
    if (userEmail) {
      finalUrl.searchParams.append('prefilled_email', userEmail);
    }
    return finalUrl.toString();
  } catch (e) {
    return '#error-url';
  }
};

export const initiateCheckout = async (planId: string, userEmail?: string): Promise<boolean> => {
try {
const paymentUrl = PAYMENT_LINKS[planId as keyof typeof PAYMENT_LINKS];
@@ -24,7 +43,6 @@
}

// 2. Validação: Garante que é um LINK (https) e não um ID (price_)
    // Isso resolve o erro "O correto deve começar com price_..." removendo a lógica antiga
if (!paymentUrl.startsWith('http')) {
alert(
`ERRO DE FORMATO NO .ENV:\n\n` +
@@ -41,18 +59,15 @@

console.log(`Redirecionando para pagamento: ${paymentUrl}`);

    // Cria a URL e adiciona o email para preenchimento automático no checkout
const finalUrl = new URL(paymentUrl);
if (userEmail) {
finalUrl.searchParams.append('prefilled_email', userEmail);
}

    // Redireciona o usuário para o Stripe
window.location.href = finalUrl.toString();
    
return true; 
} catch (err: any) {
console.error("Stripe Error:", err);
alert(`Erro ao redirecionar: ${err.message || err}`);
return false;
}
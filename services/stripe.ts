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

export const initiateCheckout = async (planId: string, userEmail?: string): Promise<boolean> => {
  try {
    const paymentUrl = PAYMENT_LINKS[planId as keyof typeof PAYMENT_LINKS];

    // 1. Validação: Verifica se a variável existe
    if (!paymentUrl) {
      alert(`ERRO DE CONFIGURAÇÃO (.env):\n\nNão encontrei o link para o plano '${planId}'.\nVerifique se o arquivo .env tem a variável VITE_STRIPE_PRICE_${planId.toUpperCase()} preenchida.`);
      return false;
    }

    // 2. Validação: Garante que é um LINK (https) e não um ID (price_)
    // Isso resolve o erro "O correto deve começar com price_..." removendo a lógica antiga
    if (!paymentUrl.startsWith('http')) {
      alert(
        `ERRO DE FORMATO NO .ENV:\n\n` +
        `O valor atual "${paymentUrl.substring(0, 15)}..." parece ser um ID antigo ou inválido.\n` +
        `Agora o sistema usa LINKS DE PAGAMENTO.\n\n` +
        `SOLUÇÃO:\n` +
        `1. Apague esse valor do seu .env\n` +
        `2. Vá no Stripe > Produtos > Preços > "Criar link de pagamento"\n` +
        `3. Copie o link (começa com https://buy.stripe.com/)\n` +
        `4. Cole no .env e REINICIE o servidor.`
      );
      return false;
    }

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
};
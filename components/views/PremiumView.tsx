
import React from 'react';
import { ViewState, UserProfile } from '../../types';
import { initiateCheckout, PLANS, STRIPE_PORTAL_URL } from '../../services/stripe';

interface PremiumViewProps {
  user: UserProfile | null;
  onNavigate: (view: ViewState) => void;
}

export const PremiumView: React.FC<PremiumViewProps> = ({ user, onNavigate }) => {
  const isPremium = user?.isPremium || false;

  const handleSubscribe = (planId: string) => {
    initiateCheckout(planId, user?.email);
  };

  const handleOpenPortal = () => {
    if (STRIPE_PORTAL_URL) {
      window.location.href = STRIPE_PORTAL_URL;
    } else {
      alert("Portal de faturamento não configurado (VITE_STRIPE_PORTAL_URL).");
    }
  };

  return (
    <div className="space-y-8 animate-slideUp">
      {/* Botão Voltar */}
      <button 
        onClick={() => onNavigate(ViewState.HOME)}
        className="text-gray-400 font-bold text-xs flex items-center gap-2 px-2 hover:text-gray-900 transition-colors"
      >
        <span>←</span> Voltar ao Início
      </button>

      {/* Hero Section - Estilo Card de Destaque */}
      <div className={`bg-gradient-to-br rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden ${
        isPremium ? 'from-emerald-500 to-teal-700 shadow-emerald-100' : 'from-amber-400 to-amber-600 shadow-amber-100'
      }`}>
        <div className="relative z-10">
          <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-4 inline-block">
            {isPremium ? 'Assinatura Ativa' : 'Chef.ai Gold'}
          </span>
          <h2 className="font-heading text-4xl font-black mb-3 leading-tight">
            {isPremium ? 'Você é\nPremium!' : 'Seja\nPremium'}
          </h2>
          <p className="text-white/80 text-sm mb-6 font-medium max-w-[220px]">
            {isPremium 
              ? 'Aproveite todos os recursos ilimitados na sua cozinha.' 
              : 'Desbloqueie todo o potencial da sua cozinha inteligente.'}
          </p>
        </div>
        
        {/* Ícone de Coroa em marca d'água */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-4 right-4 text-9xl opacity-20 grayscale brightness-200 select-none pointer-events-none transform rotate-12">
          {isPremium ? '💎' : '👑'}
        </div>
      </div>

      {isPremium ? (
        /* UI PARA USUÁRIOS PREMIUM */
        <div className="bg-white p-10 rounded-[2.2rem] border border-gray-100 shadow-soft text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-inner">
            ✨
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">Sua conta está ativa</h3>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              Obrigado por apoiar o Chef.ai! Se precisar alterar sua forma de pagamento ou cancelar, use o portal abaixo.
            </p>
          </div>
          <button 
            onClick={handleOpenPortal}
            className="w-full bg-gray-900 text-white font-black py-5 rounded-3xl shadow-lg active:scale-95 transition-all text-sm uppercase tracking-widest"
          >
            💳 Gerenciar Assinatura
          </button>
        </div>
      ) : (
        /* UI PARA NÃO ASSINANTES */
        <>
          {/* Lista de Benefícios */}
          <div className="bg-white p-7 rounded-[2.2rem] border border-gray-100 shadow-soft space-y-5">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Vantagens Exclusivas</h3>
            
            <div className="space-y-4">
              {[
                "Cardápios semanais ilimitados",
                "Análise de ingredientes por foto",
                "Tabela nutricional completa (Macros)",
                "Experiência sem anúncios",
                "Suporte prioritário via IA"
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-chef-green">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cards de Preço */}
          <div className="grid grid-cols-1 gap-4">
            {PLANS.map((plan) => {
              const isAnnual = plan.id === 'annual';
              return (
                <div 
                  key={plan.id}
                  onClick={() => handleSubscribe(plan.id)}
                  className={`p-6 rounded-[2.2rem] border transition-all cursor-pointer active:scale-[0.98] relative overflow-hidden flex items-center justify-between ${
                    isAnnual 
                      ? 'bg-emerald-50/50 border-chef-green shadow-md' 
                      : 'bg-white border-gray-100 shadow-soft hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${
                      isAnnual ? 'bg-chef-green text-white' : 'bg-gray-50 text-gray-400'
                    }`}>
                      {plan.id === 'monthly' ? '🗓️' : plan.id === 'quarterly' ? '📦' : '💎'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-gray-900 text-lg leading-none">{plan.name}</span>
                        {plan.savings && (
                          <span className="bg-chef-orange text-white text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tighter">
                            -{plan.savings}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Plano {plan.interval}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-heading text-xl font-black text-gray-900 leading-none">
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Clique para assinar</p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-[10px] text-gray-400 font-medium px-8 leading-relaxed">
            O pagamento será processado via Stripe. Você pode cancelar a qualquer momento.
          </p>
        </>
      )}
    </div>
  );
};

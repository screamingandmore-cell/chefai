
import React from 'react';
import { ViewState } from '../../types';

interface TermsViewProps {
  onBack: () => void;
}

export const TermsView: React.FC<TermsViewProps> = ({ onBack }) => {
  return (
    <div className="animate-slideUp bg-white min-h-screen pb-20">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-6 py-4 border-b border-gray-50 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h2 className="font-heading font-black text-lg text-gray-900">Termos de Uso</h2>
      </header>

      <div className="px-8 py-10 max-w-2xl mx-auto space-y-8 text-gray-700">
        <section className="space-y-4">
          <h3 className="text-sm font-black text-chef-green uppercase tracking-widest">1. Uso de Inteligência Artificial</h3>
          <p className="text-sm leading-relaxed font-medium">
            O Chef.ai utiliza modelos avançados de Inteligência Artificial para gerar sugestões de receitas e cardápios. Embora nos esforcemos para fornecer informações precisas, a IA pode cometer erros, sugerir combinações incomuns ou omitir detalhes críticos de segurança alimentar.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-black text-red-500 uppercase tracking-widest">2. Alergias e Restrições Alimentares</h3>
          <p className="text-sm leading-relaxed font-bold bg-red-50 p-4 rounded-2xl border border-red-100">
            É de inteira responsabilidade do usuário verificar todos os ingredientes sugeridos pela IA antes do consumo. O Chef.ai não se responsabiliza por reações alérgicas ou problemas de saúde decorrentes do uso das sugestões geradas.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-black text-chef-green uppercase tracking-widest">3. Assinatura Premium</h3>
          <p className="text-sm leading-relaxed font-medium">
            A versão Premium oferece recursos adicionais processados através do Stripe. O cancelamento pode ser feito a qualquer momento através do Portal do Cliente. Reembolsos seguem a política padrão das lojas de aplicativos ou do processador de pagamentos.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-black text-chef-green uppercase tracking-widest">4. Coleta de Dados</h3>
          <p className="text-sm leading-relaxed font-medium">
            Coletamos seu e-mail para sincronização de conta e preferências. Fotos da geladeira são processadas temporariamente e não são armazenadas permanentemente após a análise dos ingredientes.
          </p>
        </section>

        <div className="pt-10 text-center border-t border-gray-50">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Atualizado em Março de 2025</p>
        </div>
      </div>
    </div>
  );
};

// Fix: Exporting as default to match import in App.tsx
export default TermsView;

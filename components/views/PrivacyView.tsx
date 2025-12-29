
import React from 'react';

export const PrivacyView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
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
        <h2 className="font-heading font-black text-lg text-gray-900">Privacidade</h2>
      </header>

      <div className="px-8 py-10 max-w-2xl mx-auto space-y-8 text-gray-700">
        <section className="space-y-4">
          <h3 className="text-sm font-black text-chef-green uppercase tracking-widest">1. Coleta de Dados</h3>
          <p className="text-sm leading-relaxed font-medium">
            Coletamos seu e-mail para criação de conta e sincronização de seus cardápios. Dados de uso anônimos podem ser coletados para melhorar as sugestões da nossa IA.
          </p>
        </section>
        <div className="pt-10 text-center border-t border-gray-50">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Válido para Março de 2025</p>
        </div>
      </div>
    </div>
  );
};

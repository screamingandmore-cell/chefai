
import React, { useEffect, useRef } from 'react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewState;
  onNavigate: (view: ViewState) => void;
  isPremium: boolean;
}

export const AdBanner: React.FC<{ type: 'banner' | 'interstitial' }> = ({ type }) => {
  if (type === 'banner') {
    return (
      <div className="w-full h-[90px] bg-gray-200 border-b border-gray-300 flex flex-col items-center justify-center text-gray-500 text-xs text-center p-2 mb-4 overflow-hidden">
        <span className="font-bold">PUBLICIDADE (728x90)</span>
        <span className="text-[10px]">Espaço reservado para Google Ads</span>
      </div>
    );
  }
  return (
    <div className="my-4 w-full h-[250px] bg-gray-100 rounded-lg flex items-center justify-center border border-dashed border-gray-400 text-gray-400 relative overflow-hidden">
      <span className="text-sm">Anúncio Intersticial</span>
    </div>
  );
};

export const GoogleAdPlaceholder: React.FC<{ label?: string }> = ({ label = "Google Ads" }) => {
  return (
    <div className="w-full my-6 bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-2 py-1 text-[10px] text-gray-500 uppercase tracking-wider font-semibold text-center border-b border-gray-200">
        Publicidade
      </div>
      <div className="h-[250px] w-full bg-gray-50 flex flex-col items-center justify-center relative group">
        <div className="text-gray-400 font-medium text-sm text-center px-4">
          {label}
        </div>
        {/* Aqui o script do Google injetará o iframe do anúncio real */}
        <div className="absolute inset-0 bg-transparent" />
      </div>
    </div>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, isPremium }) => {
  const mainRef = useRef<HTMLDivElement>(null);

  // FIX: Rola para o topo sempre que a tela mudar.
  // Isso resolve o problema de clicar no rodapé e parecer que "não aconteceu nada".
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeView]);

  const navItems = [
    { id: ViewState.HOME, label: 'Início', icon: '🏠' },
    { id: ViewState.FRIDGE, label: 'Geladeira', icon: '❄️' },
    { id: ViewState.QUICK_RECIPE, label: 'Rápida', icon: '🍳' },
    { id: ViewState.WEEKLY_PLAN, label: 'Semanal', icon: '📅' },
    { id: ViewState.PREMIUM, label: 'Premium', icon: '👑' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white sm:bg-gray-50 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Header */}
      <header className="bg-white p-4 sticky top-0 z-20 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(ViewState.HOME)}>
          <div className="w-8 h-8 bg-gradient-to-tr from-chef-green to-teal-400 rounded-lg flex items-center justify-center text-white font-bold">
            C
          </div>
          <h1 className="font-bold text-xl tracking-tight text-gray-800">Chef<span className="text-chef-green">.ai</span></h1>
        </div>
        <button 
          onClick={() => onNavigate(ViewState.PROFILE)}
          className="w-8 h-8 rounded-full bg-gray-100 text-sm flex items-center justify-center border border-gray-200 hover:bg-gray-200 transition-colors"
        >
          ⚙️
        </button>
      </header>

      {/* Ad Banner Top (Free users only) */}
      {!isPremium && <AdBanner type="banner" />}

      {/* Main Content com Referência para Scroll */}
      <main ref={mainRef} className="flex-1 overflow-y-auto pb-24 p-4 scroll-smooth">
        {children}

        {/* Rodapé com Política de Privacidade */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center pb-4 relative z-10">
          <p className="text-xs text-gray-400 mb-2">Chef.ai © 2024</p>
          <div className="flex justify-center gap-4 text-xs text-gray-400">
             <button 
               type="button"
               onClick={() => onNavigate(ViewState.TERMS)} 
               className="hover:text-chef-green cursor-pointer p-2"
             >
               Termos de Uso
             </button>
             <span>•</span>
             <button 
               type="button"
               onClick={() => onNavigate(ViewState.PRIVACY)} 
               className="hover:text-chef-green cursor-pointer p-2"
             >
               Política de Privacidade
             </button>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-3 px-2 z-30 max-w-md mx-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeView === item.id 
                ? 'text-chef-green font-medium' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};


import React, { useEffect, useRef, useState } from 'react';
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
      <div className="w-full mx-auto max-w-[90%] mt-4 h-[90px] bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400 text-xs text-center border border-dashed border-gray-300 no-print">
        <span className="font-medium">PUBLICIDADE</span>
      </div>
    );
  }
  return null;
};

export const GoogleAdPlaceholder: React.FC<{ label?: string }> = ({ label = "Publicidade" }) => {
  return (
    <div className="w-full my-4 px-4 no-print">
      <div className="w-full h-[150px] bg-gray-50 border border-gray-100 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
        <div className="text-gray-300 text-xs font-medium uppercase tracking-widest">{label}</div>
      </div>
    </div>
  );
};

// Componente de Tela Cheia para Anúncios (Reward/Interstitial)
export const AdInterstitial: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [timer, setTimer] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white p-6 animate-fadeIn">
      <div className="w-full max-w-sm bg-gray-900 p-8 rounded-2xl border border-gray-800 text-center">
        <h2 className="text-xl font-bold mb-2 text-chef-green">Patrocinador</h2>
        <p className="text-gray-400 text-sm mb-8">Sua receita será liberada em instantes...</p>
        
        <div className="text-6xl font-bold mb-8 font-mono">{timer > 0 ? timer : '✅'}</div>
        
        {timer === 0 ? (
          <button 
            onClick={onFinish}
            className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors animate-bounce"
          >
            Fechar e Ver Receita
          </button>
        ) : (
          <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-chef-green transition-all duration-1000 ease-linear" 
              style={{ width: `${((5 - timer) / 5) * 100}%` }}
            />
          </div>
        )}
      </div>
      <p className="absolute bottom-8 text-xs text-gray-500">Publicidade Chef.ai</p>
    </div>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, isPremium }) => {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeView]);

  const navItems = [
    { id: ViewState.HOME, label: 'Início', icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    )},
    { id: ViewState.FRIDGE, label: 'Geladeira', icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.75a.75.75 0 00-.75.75v13a.75.75 0 00.75.75h16.5a.75.75 0 00.75-.75v-13a.75.75 0 00-.75-.75H3.75zM12 9.5v5" />
      </svg>
    )},
    { id: ViewState.QUICK_RECIPE, label: 'Rápida', icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      </svg>
    )},
    { id: ViewState.WEEKLY_PLAN, label: 'Semanal', icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    )},
    { id: ViewState.PREMIUM, label: 'Premium', icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9" />
      </svg>
    )},
  ];

  return (
    <div className="h-screen w-full flex flex-col bg-[#F5F7FA] sm:max-w-md sm:mx-auto sm:border-x sm:border-gray-200 shadow-2xl relative font-sans text-gray-800">
      
      {/* Header Minimalista */}
      <header className="bg-white px-6 pt-12 pb-4 flex justify-between items-center sticky top-0 z-30 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] no-print">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate(ViewState.HOME)}>
          <img 
            src="/icon-192.png" 
            alt="Logo" 
            className="w-8 h-8 object-contain rounded-lg"
            onError={(e) => {
              e.currentTarget.src = '/favicon.svg';
            }}
          />
          <h1 className="font-bold text-lg tracking-tight text-gray-800">Chef<span className="text-[#10b981]">.ai</span></h1>
        </div>
        <button 
          onClick={() => onNavigate(ViewState.PROFILE)}
          className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {/* Ad Banner Top (Free users only) */}
      {!isPremium && <AdBanner type="banner" />}

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-32 scroll-smooth">
        {children}

        {/* Rodapé Clean */}
        <div className="mt-12 text-center pb-8 opacity-60 no-print">
          <div className="flex justify-center gap-6 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
             <button onClick={() => onNavigate(ViewState.TERMS)} className="hover:text-gray-600">Termos</button>
             <button onClick={() => onNavigate(ViewState.PRIVACY)} className="hover:text-gray-600">Privacidade</button>
          </div>
          <p className="text-[10px] text-gray-300 mt-2">Chef.ai © 2024</p>
        </div>
      </main>

      {/* Bottom Navigation Flutuante */}
      <nav className="fixed bottom-6 left-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-white/50 flex justify-between items-center py-3 px-6 z-40 max-w-[calc(28rem-2rem)] sm:mx-auto no-print">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive 
                  ? 'text-[#10b981] scale-110' 
                  : 'text-gray-300 hover:text-gray-500'
              }`}
            >
              {item.icon(isActive)}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

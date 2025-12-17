import React, { useEffect, useRef, useState } from 'react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewState;
  onNavigate: (view: ViewState) => void;
  isPremium: boolean;
}

const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_ID;
const IS_VALID_AD_ID = ADSENSE_CLIENT_ID && !ADSENSE_CLIENT_ID.includes('0000000000000000');

// Banner Horizontal (Display)
export const AdBanner: React.FC<{ type: 'banner' | 'interstitial' }> = ({ type }) => {
  if (type === 'banner') {
    return (
      <div className="w-full mx-auto max-w-[90%] mt-4 min-h-[90px] bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-400 text-xs text-center border border-dashed border-gray-300 no-print overflow-hidden">
        <span className="font-medium mb-1">Espaço Publicitário</span>
        {IS_VALID_AD_ID && (
          <ins className="adsbygoogle"
               style={{ display: 'block', width: '100%', height: '100%' }}
               data-ad-client={ADSENSE_CLIENT_ID}
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
        )}
      </div>
    );
  }
  return null;
};

// Quadrado (Retângulo Médio)
export const GoogleAdPlaceholder: React.FC<{ label?: string }> = ({ label = "Publicidade" }) => {
  return (
    <div className="w-full my-4 px-4 no-print">
      <div className="w-full h-[250px] bg-white border border-gray-100 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
        <div className="text-gray-300 text-xs font-medium uppercase tracking-widest absolute top-2 right-2">{label}</div>
        {IS_VALID_AD_ID && (
          <ins className="adsbygoogle"
               style={{ display: 'block', width: '100%', height: '100%' }}
               data-ad-client={ADSENSE_CLIENT_ID}
               data-ad-format="rectangle"
               data-full-width-responsive="true"></ins>
        )}
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
    <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center text-white p-6 animate-fadeIn">
      <div className="w-full max-w-sm bg-gray-900 p-8 rounded-2xl border border-gray-800 text-center relative shadow-2xl">
        <h2 className="text-xl font-bold mb-2 text-chef-green">Chef.ai Premium</h2>
        <p className="text-gray-400 text-sm mb-8">Sua receita será liberada em instantes...</p>
        
        <div className="w-full h-[250px] bg-gray-800 mb-6 rounded-lg flex items-center justify-center overflow-hidden">
             {IS_VALID_AD_ID ? (
               <ins className="adsbygoogle"
                    style={{ display: 'block', width: '100%', height: '100%' }}
                    data-ad-client={ADSENSE_CLIENT_ID}
                    data-ad-format="rectangle"></ins>
             ) : (
               <span className="text-gray-600 text-xs font-medium uppercase tracking-widest">Anúncio</span>
             )}
        </div>

        <div className="text-4xl font-bold mb-6 font-mono">{timer > 0 ? `Aguarde ${timer}s` : '✅ Pronto!'}</div>
        
        {timer === 0 && (
          <button 
            onClick={onFinish}
            className="w-full bg-chef-green text-white font-bold py-4 rounded-xl hover:bg-green-600 transition-all shadow-lg animate-bounce"
          >
            Ver Receita
          </button>
        )}
      </div>
    </div>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, isPremium }) => {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (IS_VALID_AD_ID && !isPremium) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn("AdSense logic failed to initialize.");
      }
    }
  }, [activeView, isPremium]);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeView]);

  const navItems = [
    { id: ViewState.HOME, icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    )},
    { id: ViewState.FRIDGE, icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.75a.75.75 0 00-.75.75v13a.75.75 0 00.75.75h16.5a.75.75 0 00.75-.75v-13a.75.75 0 00-.75-.75H3.75zM12 9.5v5" />
      </svg>
    )},
    { id: ViewState.WEEKLY_PLAN, icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    )},
    { id: ViewState.PROFILE, icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={active ? "0" : "2"} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
  ];

  return (
    <div className="h-screen w-full flex flex-col bg-[#F8FAFC] sm:max-w-md sm:mx-auto sm:border-x sm:border-gray-100 shadow-2xl relative font-sans text-gray-800">
      
      <header className="bg-white/80 backdrop-blur-md px-6 pt-12 pb-4 flex justify-between items-center sticky top-0 z-40 shadow-sm no-print">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(ViewState.HOME)}>
          <div className="bg-chef-green p-1.5 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h1 className="font-black text-xl tracking-tight text-gray-900">Chef<span className="text-chef-green">.ai</span></h1>
        </div>
        <button 
          onClick={() => onNavigate(ViewState.PROFILE)}
          className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors border border-gray-100 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {!isPremium && <AdBanner type="banner" />}

      <main ref={mainRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-32 scroll-smooth">
        {children}

        <div className="mt-12 text-center pb-8 opacity-40 no-print">
          <div className="flex justify-center gap-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
             <button onClick={() => onNavigate(ViewState.TERMS)} className="hover:text-gray-900">Termos</button>
             <button onClick={() => onNavigate(ViewState.PRIVACY)} className="hover:text-gray-900">Privacidade</button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">© 2024 Chef.ai Studio</p>
        </div>
      </main>

      <nav className="fixed bottom-6 left-6 right-6 bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl flex justify-between items-center py-4 px-8 z-50 max-w-[calc(28rem-3rem)] sm:mx-auto no-print border border-white/10">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive 
                  ? 'text-chef-green scale-125' 
                  : 'text-gray-500 hover:text-gray-300'
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
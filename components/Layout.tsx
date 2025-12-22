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

export const AdBanner: React.FC<{ type: 'banner' | 'interstitial' }> = ({ type }) => {
  if (type === 'banner') {
    return (
      <div className="w-full mx-auto max-w-[90%] mt-4 min-h-[90px] bg-gray-50 rounded-[1.5rem] flex flex-col items-center justify-center text-gray-400 text-[10px] text-center border border-dashed border-gray-200 no-print overflow-hidden font-bold tracking-widest uppercase opacity-80">
        <span className="mb-1 opacity-50">Pub</span>
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

export const AdInterstitial = () => <AdBanner type="interstitial" />;
export const GoogleAdPlaceholder = () => <AdBanner type="banner" />;

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, isPremium }) => {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeView]);

  const navItems = [
    { 
      id: ViewState.HOME, 
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      id: ViewState.FRIDGE, 
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 11h18" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v1" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 15v2" />
        </svg>
      )
    },
    { 
      id: ViewState.WEEKLY_PLAN, 
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: ViewState.PROFILE, 
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
  ];

  return (
    <div className="h-screen w-full flex flex-col bg-[#FDFDFD] sm:max-w-md sm:mx-auto sm:border-x sm:border-gray-50 shadow-[0_0_80px_rgba(0,0,0,0.03)] relative font-sans text-gray-800 selection:bg-chef-green selection:text-white overflow-hidden">
      
      <header className="bg-white/80 backdrop-blur-xl px-6 pt-12 pb-5 flex justify-between items-center sticky top-0 z-40 no-print border-b border-gray-50/50">
        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => onNavigate(ViewState.HOME)}>
          <div className="bg-chef-green p-2 rounded-xl shadow-lg shadow-emerald-100 group-hover:rotate-6 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h1 className="font-heading font-black text-2xl tracking-tighter text-gray-900">Chef<span className="text-chef-green">.ai</span></h1>
        </div>
        
        <div className="flex items-center gap-3">
           {isPremium && <div className="w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_10px_#F59E0B]"></div>}
           <button 
            onClick={() => onNavigate(ViewState.PROFILE)}
            className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-soft transition-all border border-gray-100/50"
           >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
           </button>
        </div>
      </header>

      {!isPremium && <AdBanner type="banner" />}

      {/* pb-40 garante que o conteúdo role para cima do menu flutuante */}
      <main ref={mainRef} className="flex-1 overflow-y-auto pt-6 pb-40 scroll-smooth no-scrollbar relative min-h-0">
        {children}
      </main>

      {/* Menu Flutuante Glass Floating */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md h-16 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 flex items-center justify-around z-50 no-print px-4 transition-all duration-300">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const isFridge = item.id === ViewState.FRIDGE;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex items-center justify-center transition-all duration-300 active:scale-90 ${
                isActive ? 'w-12 h-12' : 'w-10 h-10'
              } ${isFridge ? 'scale-110' : ''}`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-emerald-50 rounded-xl animate-fadeIn transition-all duration-300"></div>
              )}
              <div className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-emerald-500 scale-105' : 'text-gray-400 hover:text-gray-600'}`}>
                {item.icon(isActive)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
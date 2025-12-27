
import React from 'react';
import { ViewState, UserProfile, WeeklyMenu } from '../../types';

interface HomeViewProps {
  user: UserProfile | null;
  weeklyMenu: WeeklyMenu | null;
  onNavigate: (view: ViewState) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ user, weeklyMenu, onNavigate }) => {
  return (
    <div className="space-y-8 animate-slideUp">
      <div className="px-2">
        <h3 className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.2em] mb-1 font-sans">Bem-vindo ao</h3>
        <h2 className="font-heading text-4xl font-black text-gray-900 leading-tight">Chef<span className="text-chef-green">.ai</span></h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div 
          onClick={() => onNavigate(ViewState.QUICK_RECIPE)}
          className="bg-gradient-to-br from-chef-orange to-rose-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-orange-100 relative overflow-hidden cursor-pointer group active:scale-95 transition-all flex flex-col justify-between aspect-square"
        >
          <div className="relative z-10">
            <span className="text-3xl mb-2 block">⚡</span>
            <h2 className="font-heading text-lg font-black leading-tight">Receita<br/>Rápida</h2>
          </div>
          <div className="relative z-10 text-[10px] font-bold uppercase tracking-wider opacity-80">Cozinhe Agora</div>
          <div className="absolute -bottom-4 -right-4 text-8xl opacity-10 grayscale brightness-200 select-none pointer-events-none group-hover:scale-110 transition-transform">🍳</div>
        </div>

        <div 
          onClick={() => onNavigate(ViewState.FRIDGE)}
          className="bg-gradient-to-br from-chef-green to-emerald-700 rounded-[2.5rem] p-6 text-white shadow-xl shadow-emerald-100 relative overflow-hidden cursor-pointer group active:scale-95 transition-all flex flex-col justify-between aspect-square"
        >
          <div className="relative z-10">
            <span className="text-3xl mb-2 block">📅</span>
            <h2 className="font-heading text-lg font-black leading-tight">Cardápio<br/>Semanal</h2>
          </div>
          <div className="relative z-10 text-[10px] font-bold uppercase tracking-wider opacity-80">Planejar Semana</div>
          <div className="absolute -bottom-4 -right-4 text-8xl opacity-10 grayscale brightness-200 select-none pointer-events-none group-hover:scale-110 transition-transform">🥗</div>
        </div>
      </div>

      {!user?.isPremium && (
        <div 
          onClick={() => onNavigate(ViewState.PREMIUM)}
          className="bg-white border-2 border-amber-100 rounded-[2rem] p-6 shadow-premium relative overflow-hidden cursor-pointer active:scale-95 transition-all"
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">👑</div>
            <div className="flex-1">
              <h4 className="font-heading text-lg font-black text-amber-800">Chef Premium</h4>
              <p className="text-[11px] text-amber-700 font-semibold opacity-80 uppercase tracking-wider">Receitas Ilimitadas & Fotos</p>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-amber-50 rounded-full blur-2xl opacity-50"></div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div 
          onClick={() => onNavigate(ViewState.WEEKLY_PLAN)}
          className="bg-white p-6 rounded-[2.2rem] border border-gray-100 shadow-soft flex flex-col items-center text-center gap-4 active:scale-95 transition-all cursor-pointer hover:border-chef-green/30"
        >
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl">📋</div>
          <div>
            <span className="block font-bold text-gray-800 text-sm">Planejamento Semanal</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ver Plano Ativo</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate(ViewState.PROFILE)}
          className="bg-white p-6 rounded-[2.2rem] border border-gray-100 shadow-soft flex flex-col items-center text-center gap-4 active:scale-95 transition-all cursor-pointer hover:border-blue-200"
        >
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl">⚙️</div>
          <div>
            <span className="block font-bold text-gray-800 text-sm">Perfil</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ajustes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;

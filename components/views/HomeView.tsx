import React from 'react';
import { ViewState, UserProfile, WeeklyMenu } from '../../types';
import { AdBanner } from '../Layout';

interface HomeViewProps {
  user: UserProfile | null;
  weeklyMenu: WeeklyMenu | null;
  onNavigate: (view: ViewState) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ user, weeklyMenu, onNavigate }) => {
  return (
    <div className="space-y-6 animate-slideUp">
      <div className="bg-gradient-to-r from-chef-green to-teal-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2">O que vamos cozinhar hoje?</h2>
          <p className="text-white/80 text-sm mb-6 font-medium">Use o que você tem e evite desperdícios.</p>
          <button onClick={() => onNavigate(ViewState.FRIDGE)} className="bg-white text-chef-green px-8 py-4 rounded-2xl font-black shadow-lg hover:scale-105 transition-transform active:scale-95">
            Abrir minha Geladeira
          </button>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl">🍳</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onNavigate(ViewState.FRIDGE)} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:shadow-md transition-shadow active:scale-95">
          <span className="text-4xl bg-orange-50 p-4 rounded-2xl">⚡</span>
          <span className="font-bold text-gray-800 text-sm">Receita Rápida</span>
        </button>
        <button onClick={() => onNavigate(ViewState.WEEKLY_PLAN)} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:shadow-md transition-shadow active:scale-95">
          <span className="text-4xl bg-blue-50 p-4 rounded-2xl">📅</span>
          <span className="font-bold text-gray-800 text-sm">Cardápio Auto</span>
        </button>
      </div>

      {!user?.isPremium && <AdBanner type="banner" />}

      {weeklyMenu && (
        <div onClick={() => onNavigate(ViewState.WEEKLY_PLAN)} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm cursor-pointer mt-4 hover:bg-gray-50 transition-colors flex justify-between items-center group">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Último Planejamento</p>
            <p className="text-gray-800 font-bold">Criado em {new Date(weeklyMenu.createdAt).toLocaleDateString()}</p>
          </div>
          <span className="text-chef-green font-black text-xl group-hover:translate-x-1 transition-transform">→</span>
        </div>
      )}
    </div>
  );
};
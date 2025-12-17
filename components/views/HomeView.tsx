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
      <div className="bg-gradient-to-r from-chef-green to-teal-500 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">O que vamos cozinhar?</h2>
        <div className="flex gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">BETA TEST</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">{user?.isPremium ? 'PREMIUM' : 'FREE'}</span>
        </div>
        <button onClick={() => onNavigate(ViewState.FRIDGE)} className="bg-white text-chef-green px-6 py-3 rounded-xl font-bold shadow-md w-full sm:w-auto mt-4 hover:bg-gray-50 transition-colors">
          Abrir Geladeira
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onNavigate(ViewState.FRIDGE)} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:shadow-md transition-shadow">
          <span className="text-3xl bg-orange-50 p-3 rounded-full">🍳</span>
          <span className="font-bold text-gray-700 text-sm">Receita Rápida</span>
        </button>
        <button onClick={() => onNavigate(ViewState.WEEKLY_PLAN)} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:shadow-md transition-shadow">
          <span className="text-3xl bg-blue-50 p-3 rounded-full">📅</span>
          <span className="font-bold text-gray-700 text-sm">Cardápio Auto</span>
        </button>
      </div>

      {!user?.isPremium && <AdBanner type="banner" />}

      {weeklyMenu && (
        <div onClick={() => onNavigate(ViewState.WEEKLY_PLAN)} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer mt-8 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-500">Último: {new Date(weeklyMenu.createdAt).toLocaleDateString()}</p>
          <p className="text-chef-green font-medium mt-1">Ver cardápio →</p>
        </div>
      )}
    </div>
  );
};
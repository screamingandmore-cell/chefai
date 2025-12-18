
import React from 'react';
import { ViewState, WeeklyMenu, Recipe } from '../../types';
import { GoogleAdPlaceholder } from '../Layout';

interface WeeklyPlanViewProps {
  weeklyMenu: WeeklyMenu | null;
  onNavigate: (v: ViewState) => void;
  onSelectRecipe: (r: Recipe) => void;
  onDeleteMenu: (id: string) => void;
}

export const WeeklyPlanView: React.FC<WeeklyPlanViewProps> = ({
  weeklyMenu,
  onNavigate,
  onSelectRecipe,
  onDeleteMenu
}) => {
  if (!weeklyMenu) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
        <span className="text-6xl">🍲</span>
        <h3 className="text-xl font-bold text-gray-800">Nenhum cardápio ativo</h3>
        <p className="text-gray-500 text-sm">Vá até a aba Geladeira e gere um novo planejamento semanal!</p>
        <button onClick={() => onNavigate(ViewState.FRIDGE)} className="bg-chef-green text-white px-8 py-3 rounded-xl font-bold">Abrir Geladeira</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slideUp">
      <div className="flex justify-between items-center no-print">
        <button onClick={() => onNavigate(ViewState.HOME)} className="text-gray-400 font-bold text-xs flex items-center gap-2">
          <span>←</span> Início
        </button>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-white border border-gray-100 w-10 h-10 rounded-xl flex items-center justify-center">🖨️</button>
          <button onClick={() => onDeleteMenu(weeklyMenu.id)} className="bg-white border border-gray-100 w-10 h-10 rounded-xl flex items-center justify-center text-red-400">🗑️</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-2xl font-black text-gray-800">Seu Cardápio</h2>
           <button 
            onClick={() => onNavigate(ViewState.SHOPPING_LIST)} 
            className="bg-chef-green text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
          >
            🛒 Lista
          </button>
        </div>
        
        <div className="space-y-4">
          {weeklyMenu.days.map((day, i) => (
            <div key={i} className="bg-gray-50/50 rounded-3xl p-4 border border-gray-100">
               <span className="bg-gray-900 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded mb-3 inline-block">
                 {day.day}
               </span>
               <div className="grid gap-2">
                  <div onClick={() => onSelectRecipe(day.lunch)} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 cursor-pointer">
                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-lg">☀️</div>
                    <p className="text-gray-800 font-bold text-sm truncate">{day.lunch.title}</p>
                  </div>
                  <div onClick={() => onSelectRecipe(day.dinner)} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 cursor-pointer">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-lg">🌙</div>
                    <p className="text-gray-800 font-bold text-sm truncate">{day.dinner.title}</p>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

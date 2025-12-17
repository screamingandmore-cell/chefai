
import React from 'react';
import { ViewState, WeeklyMenu, DietGoal, DIET_GOALS, Recipe } from '../../types';
import { IngredientInput } from '../shared/IngredientInput';
import { GoogleAdPlaceholder } from '../Layout';

interface WeeklyPlanViewProps {
  weeklyMenu: WeeklyMenu | null;
  ingredients: string[];
  onAddIngredient: (items: string[]) => void;
  onRemoveIngredient: (index: number) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dietGoal: DietGoal;
  setDietGoal: (g: DietGoal) => void;
  onGenerate: () => void;
  onNavigate: (v: ViewState) => void;
  onSelectRecipe: (r: Recipe) => void;
  onDeleteMenu: (id: string) => void;
  isLoading: boolean;
  isPremium: boolean;
  error: string | null;
}

export const WeeklyPlanView: React.FC<WeeklyPlanViewProps> = ({
  weeklyMenu,
  ingredients,
  onAddIngredient,
  onRemoveIngredient,
  onImageUpload,
  dietGoal,
  setDietGoal,
  onGenerate,
  onNavigate,
  onSelectRecipe,
  onDeleteMenu,
  isLoading,
  isPremium,
  error
}) => {
  if (!weeklyMenu) {
    return (
      <div className="space-y-6 animate-slideUp">
        <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
             <div className="bg-emerald-100 p-3 rounded-2xl text-2xl">📅</div>
             <h2 className="text-2xl font-black text-gray-800">Plano Semanal</h2>
          </div>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Nossa IA vai organizar sua semana inteira, focando no que você já tem para economizar tempo e dinheiro.
          </p>

          <div className="mb-8">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Ingredientes Base</p>
             <IngredientInput 
                ingredients={ingredients}
                onAdd={onAddIngredient}
                onRemove={onRemoveIngredient}
                onImageUpload={onImageUpload}
                isLoading={isLoading}
                isPremium={isPremium}
             />
          </div>
          
          <div className="mb-10">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Objetivo da Dieta</p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(DIET_GOALS) as DietGoal[]).map((goal) => (
                 <button 
                   key={goal}
                   onClick={() => setDietGoal(goal)}
                   className={`p-4 rounded-2xl border-2 text-left transition-all ${
                     dietGoal === goal 
                      ? 'border-chef-green bg-green-50 shadow-inner' 
                      : 'border-gray-50 bg-gray-50/50 hover:border-gray-200'
                   }`}
                 >
                   <span className={`font-bold text-xs block ${dietGoal === goal ? 'text-chef-green' : 'text-gray-500'}`}>
                     {DIET_GOALS[goal]}
                   </span>
                 </button>
              ))}
            </div>
          </div>

          <button 
             onClick={onGenerate} 
             disabled={isLoading || ingredients.length === 0}
             className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl shadow-2xl hover:bg-black disabled:bg-gray-200 disabled:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
          >
             {isLoading ? (
               <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-sm uppercase tracking-widest">Organizando sua semana...</span>
               </div>
             ) : (
               <>
                <span className="text-sm uppercase tracking-widest">Gerar Cardápio Inteligente</span>
                <span className="group-hover:translate-x-1 transition-transform">🚀</span>
               </>
             )}
          </button>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 text-[10px] font-bold rounded-xl border border-red-100 text-center animate-bounce uppercase tracking-widest">
              {error}
            </div>
          )}
        </div>

        <div className="text-center pt-4">
           <button onClick={() => onNavigate(ViewState.MENU_HISTORY)} className="text-gray-400 text-[10px] font-black hover:text-chef-green transition-colors uppercase tracking-[0.2em] border-b border-gray-200 pb-1">
             Ver Histórico de Planos
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slideUp">
      <div className="flex justify-between items-center mb-2 no-print">
        <button onClick={() => onNavigate(ViewState.HOME)} className="text-gray-400 font-bold text-xs flex items-center gap-2 hover:text-gray-800 transition-colors">
          <span>←</span> Início
        </button>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-white shadow-sm border border-gray-100 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors" title="Imprimir">🖨️</button>
          <button onClick={() => onDeleteMenu(weeklyMenu.id)} className="bg-white shadow-sm border border-gray-100 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 text-red-400 transition-colors" title="Deletar">🗑️</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 no-print">
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-2xl font-black text-gray-800">Seu Cardápio</h2>
           <button 
            onClick={() => onNavigate(ViewState.SHOPPING_LIST)} 
            className="bg-chef-green text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-green-200"
          >
            🛒 Lista de Compras
          </button>
        </div>
        
        <div className="space-y-4">
          {weeklyMenu.days.map((day, i) => (
            <div key={i} className="bg-gray-50/50 rounded-3xl p-5 border border-gray-100">
               <div className="flex items-center justify-between mb-4">
                  <span className="bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">
                    {day.day}
                  </span>
               </div>
               
               <div className="grid gap-3">
                  <div 
                    onClick={() => onSelectRecipe(day.lunch)}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-chef-green transition-all flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl">☀️</div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Almoço</p>
                      <p className="text-gray-800 font-bold truncate group-hover:text-chef-green transition-colors">{day.lunch.title}</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => onSelectRecipe(day.dinner)}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-blue-400 transition-all flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">🌙</div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jantar</p>
                      <p className="text-gray-800 font-bold truncate group-hover:text-blue-500 transition-colors">{day.dinner.title}</p>
                    </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {!isPremium && <GoogleAdPlaceholder />}
    </div>
  );
};

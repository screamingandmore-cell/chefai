
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
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold mb-2">Planejador Automático</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">A IA vai montar seu cardápio semanal focando no que você já tem para evitar desperdício.</p>

          <div className="mb-6">
             <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-4 text-xs text-green-800 font-medium">
                Dica: Quanto mais ingredientes você listar, mais preciso será o plano.
             </div>
             <IngredientInput 
                ingredients={ingredients}
                onAdd={onAddIngredient}
                onRemove={onRemoveIngredient}
                onImageUpload={onImageUpload}
                isLoading={isLoading}
                isPremium={isPremium}
             />
          </div>
          
          <div className="mb-8">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Estilo de Dieta</p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(DIET_GOALS) as DietGoal[]).map((goal) => (
                 <button 
                   key={goal}
                   onClick={() => setDietGoal(goal)}
                   className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                     dietGoal === goal 
                      ? 'border-chef-green bg-green-50 ring-2 ring-chef-green/20' 
                      : 'border-gray-100 hover:border-gray-300 bg-gray-50/50'
                   }`}
                 >
                   <span className={`font-bold text-xs block relative z-10 ${dietGoal === goal ? 'text-chef-green' : 'text-gray-600'}`}>
                     {DIET_GOALS[goal]}
                   </span>
                 </button>
              ))}
            </div>
          </div>

          <button 
             onClick={onGenerate} 
             disabled={isLoading || ingredients.length === 0}
             className="w-full bg-chef-green text-white font-bold py-5 rounded-2xl shadow-[0_10px_20px_rgba(4,120,87,0.2)] hover:bg-green-700 disabled:bg-gray-200 disabled:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
             {isLoading ? (
               <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                IA Analisando Ingredientes...
               </>
             ) : '🚀 Criar Cardápio Inteligente'}
          </button>
          
          {error && <div className="mt-4 p-4 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 text-center animate-bounce">{error}</div>}
        </div>

        <div className="text-center pt-4">
           <button onClick={() => onNavigate(ViewState.MENU_HISTORY)} className="text-gray-400 text-xs font-medium hover:text-chef-green transition-colors uppercase tracking-widest underline decoration-dashed">
             Ver Histórico de Planejamentos
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slideUp">
      <div className="flex justify-between items-start mb-2 no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Plano Semanal</h2>
          <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-tighter">
            Criado em: {new Date(weeklyMenu.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onNavigate(ViewState.MENU_HISTORY)} className="bg-white shadow-sm border border-gray-100 p-2.5 rounded-xl hover:bg-gray-50 transition-colors" title="Histórico">📜</button>
          <button onClick={() => window.print()} className="bg-white shadow-sm border border-gray-100 p-2.5 rounded-xl hover:bg-gray-50 text-blue-500 transition-colors" title="Imprimir">🖨️</button>
          <button onClick={() => onDeleteMenu(weeklyMenu.id)} className="bg-white shadow-sm border border-gray-100 p-2.5 rounded-xl hover:bg-gray-50 text-red-400 transition-colors" title="Deletar">🗑️</button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 no-print">
        <button 
          onClick={() => onNavigate(ViewState.SHOPPING_LIST)} 
          className="bg-chef-green text-white py-4 rounded-2xl font-bold border border-chef-green shadow-lg hover:bg-green-700 transition-all flex flex-col items-center gap-1"
        >
          <span className="text-xl">🛒</span>
          <span className="text-[10px] uppercase tracking-tighter">Lista de Compras</span>
        </button>
        <button 
          onClick={() => onNavigate(ViewState.FRIDGE)} 
          className="bg-white text-gray-600 py-4 rounded-2xl font-bold border border-gray-100 shadow-sm hover:bg-gray-50 transition-all flex flex-col items-center gap-1"
        >
          <span className="text-xl">🔄</span>
          <span className="text-[10px] uppercase tracking-tighter">Novo Planejamento</span>
        </button>
      </div>

      {!isPremium && <GoogleAdPlaceholder />}

      <div className="space-y-5">
        {weeklyMenu.days.map((day, i) => (
          <div key={i} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:border-chef-green/30 transition-colors">
            <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">{day.day}</h3>
              {isPremium && <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">RECOMENDADO</span>}
            </div>
            <div className="p-4 space-y-4">
              <div onClick={() => onSelectRecipe(day.lunch)} className="cursor-pointer hover:bg-green-50/30 p-3 rounded-2xl transition-all group">
                <div className="flex justify-between items-center">
                  <p className="text-gray-800 font-bold text-sm">☀️ Almoço: {day.lunch.title}</p>
                  <span className="text-gray-300 group-hover:text-chef-green transition-colors">→</span>
                </div>
                {isPremium && day.lunch.calories && (
                  <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">
                    {day.lunch.calories} KCAL | P: {day.lunch.macros?.protein} | C: {day.lunch.macros?.carbs}
                  </p>
                )}
              </div>

              <div className="border-t border-gray-50 mx-3" />
              
              <div onClick={() => onSelectRecipe(day.dinner)} className="cursor-pointer hover:bg-blue-50/30 p-3 rounded-2xl transition-all group">
                <div className="flex justify-between items-center">
                  <p className="text-gray-800 font-bold text-sm">🌙 Jantar: {day.dinner.title}</p>
                  <span className="text-gray-300 group-hover:text-blue-500 transition-colors">→</span>
                </div>
                {isPremium && day.dinner.calories && (
                  <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">
                    {day.dinner.calories} KCAL | P: {day.dinner.macros?.protein} | C: {day.dinner.macros?.carbs}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

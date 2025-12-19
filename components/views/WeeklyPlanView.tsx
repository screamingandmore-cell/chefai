
import React from 'react';
import { ViewState, WeeklyMenu, Recipe, DietGoal, DIET_GOALS, Difficulty } from '../../types';

interface WeeklyPlanViewProps {
  weeklyMenu: WeeklyMenu | null;
  onNavigate: (v: ViewState) => void;
  onSelectRecipe: (r: Recipe) => void;
  onDeleteMenu: (id: string) => void;
  dietGoal: DietGoal;
  setDietGoal: (g: DietGoal) => void;
  selectedDifficulty: Difficulty;
  setSelectedDifficulty: (d: Difficulty) => void;
  onGenerateWeekly: () => void;
  isLoading: boolean;
}

export const WeeklyPlanView: React.FC<WeeklyPlanViewProps> = ({
  weeklyMenu,
  onNavigate,
  onSelectRecipe,
  onDeleteMenu,
  dietGoal,
  setDietGoal,
  selectedDifficulty,
  setSelectedDifficulty,
  onGenerateWeekly,
  isLoading
}) => {
  if (!weeklyMenu) {
    return (
      <div className="flex flex-col items-center justify-start w-full min-h-screen pt-4 pb-40 animate-slideUp">
        <div className="w-full max-w-md px-6 flex flex-col items-center text-center space-y-8">
          <div className="mt-12">
             <span className="text-7xl block mb-4">🍲</span>
             <h3 className="text-2xl font-black text-gray-900 leading-tight">Nenhum cardápio ativo</h3>
             <p className="text-gray-400 text-sm mt-2">Escolha seu objetivo e dificuldade para planejar a semana.</p>
          </div>

          <div className="w-full bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-soft space-y-6">
            <div className="w-full">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-5">Configurações do Plano</p>
              <div className="grid grid-cols-2 gap-3 w-full">
                {(Object.keys(DIET_GOALS) as DietGoal[]).map((goal) => {
                   const isChefChoice = goal === 'chef_choice';
                   const isSelected = dietGoal === goal;
                   
                   let buttonStyle = isSelected 
                     ? 'border-chef-green bg-emerald-50 text-chef-green shadow-sm' 
                     : 'border-gray-50 bg-gray-50/50 text-gray-400';
                   
                   if (isChefChoice && isSelected) {
                     buttonStyle = 'border-amber-500 bg-yellow-100 text-amber-800 shadow-md';
                   }

                   return (
                     <button 
                       key={goal}
                       onClick={() => setDietGoal(goal)}
                       className={`p-3.5 rounded-2xl border-2 text-center transition-all active:scale-95 ${buttonStyle}`}
                     >
                       <span className="font-black text-[9px] uppercase tracking-wider">
                         {DIET_GOALS[goal]}
                       </span>
                     </button>
                   );
                })}
              </div>
            </div>

            <div className="w-full">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-4">Nível de Habilidade</p>
              <div className="flex bg-gray-100/50 rounded-2xl p-1.5 border border-gray-100 shadow-inner w-full">
                {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map((diff) => (
                  <button 
                    key={diff} 
                    onClick={() => setSelectedDifficulty(diff)} 
                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      selectedDifficulty === diff 
                        ? 'bg-chef-green text-white shadow-lg shadow-emerald-100' 
                        : 'text-gray-400'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              onClick={onGenerateWeekly} 
              disabled={isLoading}
              className="w-full bg-chef-green text-white py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 active:scale-95 transition-all"
            >
              {isLoading ? "Planejando..." : "Gerar Cardápio Semanal"}
            </button>
          </div>

          <button onClick={() => onNavigate(ViewState.FRIDGE)} className="text-chef-green font-bold text-xs uppercase tracking-widest">
             ← Voltar para Geladeira
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start w-full min-h-screen pt-4 pb-40 animate-slideUp">
      <div className="w-full max-w-md px-6 space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center no-print w-full">
          <button onClick={() => onNavigate(ViewState.HOME)} className="text-gray-400 font-bold text-xs flex items-center gap-2 hover:text-gray-900 transition-colors">
            <span>←</span> Início
          </button>
          <div className="flex gap-2">
            <button onClick={() => onNavigate(ViewState.MENU_HISTORY)} className="bg-white border border-gray-100 px-3 py-2 rounded-xl flex items-center justify-center text-[9px] font-black uppercase tracking-widest shadow-sm">📜 Histórico</button>
            <button onClick={() => window.print()} className="bg-white border border-gray-100 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm">🖨️</button>
            <button 
              onClick={() => onDeleteMenu(weeklyMenu.id)} 
              className="bg-white border border-gray-100 w-10 h-10 rounded-xl flex items-center justify-center text-red-400 shadow-sm"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="w-full bg-white p-7 rounded-[2.5rem] shadow-soft border border-gray-100">
          <div className="flex items-center justify-between mb-8">
             <div className="flex-1 overflow-hidden">
               <h2 className="text-2xl font-black text-gray-900 leading-tight truncate">Meu Cardápio</h2>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                 Meta: {DIET_GOALS[weeklyMenu.goal as DietGoal] || weeklyMenu.goal || 'Equilibrado'}
               </p>
             </div>
             <button 
              onClick={() => onNavigate(ViewState.SHOPPING_LIST)} 
              className="bg-chef-green text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 active:scale-95 transition-all shrink-0"
            >
              🛒 Lista
            </button>
          </div>
          
          <div className="w-full space-y-5">
            {weeklyMenu.days.map((day, i) => (
              <div key={i} className="w-full bg-gray-50/50 rounded-[2rem] p-5 border border-gray-100/50">
                 <span className="bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl mb-4 inline-block">
                   {day.day}
                 </span>
                 <div className="w-full space-y-3">
                    <div onClick={() => onSelectRecipe(day.lunch)} className="w-full bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-chef-orange/50 transition-colors shadow-sm active:scale-[0.98]">
                      <div className="w-10 h-10 min-w-[2.5rem] bg-orange-50 rounded-xl flex items-center justify-center text-2xl shadow-inner">☀️</div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-gray-900 font-black text-sm truncate">{day.lunch.title}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Almoço</p>
                      </div>
                    </div>
                    <div onClick={() => onSelectRecipe(day.dinner)} className="w-full bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-blue-200 transition-colors shadow-sm active:scale-[0.98]">
                      <div className="w-10 h-10 min-w-[2.5rem] bg-blue-50 rounded-xl flex items-center justify-center text-2xl shadow-inner">🌙</div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-gray-900 font-black text-sm truncate">{day.dinner.title}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Jantar</p>
                      </div>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
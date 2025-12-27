import React from 'react';
import { Recipe } from '../../types';
import { GoogleAdPlaceholder } from '../Layout';

interface RecipeDetailsViewProps {
  recipe: Recipe | null | undefined;
  isPremium: boolean;
  onBack: () => void;
}

export const RecipeDetailsView: React.FC<RecipeDetailsViewProps> = ({ recipe, isPremium, onBack }) => {
  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-fadeIn">
        <span className="text-6xl mb-6">🔍</span>
        <h3 className="text-xl font-black text-gray-800">Receita não encontrada</h3>
        <p className="text-gray-400 text-sm mt-2 mb-8">Não foi possível recuperar os detalhes técnicos desta preparação.</p>
        <button 
          onClick={onBack}
          className="bg-chef-green text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-100 active:scale-95 transition-all"
        >
          Voltar e tentar novamente
        </button>
      </div>
    );
  }
  
  const safeIngredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const safeInstructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];

  return (
    <div className="animate-slideUp space-y-6 px-4">
      <button onClick={onBack} className="text-gray-500 mb-2 hover:text-gray-800 no-print flex items-center gap-1 font-bold text-sm">
        <span>←</span> Voltar
      </button>
      
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 pb-10">
        <div className="bg-gradient-to-br from-amber-400 via-chef-orange to-rose-500 p-8 text-white relative shadow-lg shadow-orange-100/50">
          <h2 className="text-2xl font-black pr-12 leading-tight drop-shadow-md">{recipe.title || "Preparação Técnica"}</h2>
          <div className="flex gap-3 mt-5 text-[10px] font-black uppercase tracking-widest">
            <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-1 font-black">⏱️ {recipe.prepTime}</span>
            <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-1 font-black">🔥 {recipe.difficulty}</span>
          </div>
          <button 
            onClick={() => window.print()} 
            className="absolute top-8 right-8 bg-white/20 p-2.5 rounded-2xl no-print hover:bg-white/30 transition-all border border-white/10 active:scale-90 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231a1.125 1.125 0 01-1.12-1.227L6.34 18m11.318-4.171a3 3 0 000-5.658L12 5.25 6.342 8.171a3 3 0 000 5.658m11.318 0l-.131.066m-11.187 0l.131.066" />
            </svg>
          </button>
        </div>

        <div className="p-8 space-y-10">
          {/* Descrição Técnica */}
          {recipe.description && (
            <p className="text-gray-600 text-sm leading-relaxed font-semibold italic border-l-4 border-chef-orange pl-4 py-1">
              {recipe.description}
            </p>
          )}
          
          {isPremium && recipe.calories && (
            <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-6 grid grid-cols-4 gap-2 text-center shadow-inner">
              <div><div className="text-lg font-black text-gray-800">{recipe.calories}</div><div className="text-[9px] text-gray-400 font-bold uppercase">Kcal</div></div>
              <div><div className="text-lg font-black text-gray-800">{recipe.macros?.protein || '-'}</div><div className="text-[9px] text-gray-400 font-bold uppercase">Prot</div></div>
              <div><div className="text-lg font-black text-gray-800">{recipe.macros?.carbs || '-'}</div><div className="text-[9px] text-gray-400 font-bold uppercase">Carb</div></div>
              <div><div className="text-lg font-black text-gray-800">{recipe.macros?.fat || '-'}</div><div className="text-[9px] text-gray-400 font-bold uppercase">Gord</div></div>
            </div>
          )}

          {!isPremium && <GoogleAdPlaceholder />}

          {/* Mise en Place (Ingredientes) */}
          <div>
            <h3 className="font-black text-gray-900 mb-5 text-[11px] uppercase tracking-[0.2em] flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-chef-green rounded-full"></span> Mise en Place
            </h3>
            <div className="grid gap-3">
                {safeIngredients.map((ing, i) => (
                  <label key={i} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-chef-green/10 transition-colors cursor-pointer group active:scale-[0.99]">
                      <input type="checkbox" className="w-5 h-5 accent-chef-green rounded-lg border-gray-200" />
                      <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">{ing}</span>
                  </label>
                ))}
            </div>
          </div>
          
          <hr className="border-gray-50" />
          
          {/* Execução de Mestre */}
          <div>
            <h3 className="font-black text-gray-900 mb-6 text-[11px] uppercase tracking-[0.2em] flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-chef-orange rounded-full"></span> Execução de Mestre
            </h3>
            <div className="space-y-10 relative">
                <div className="absolute left-[13px] top-4 bottom-4 w-px bg-gray-100"></div>
                {safeInstructions.map((step, i) => (
                  <div key={i} className="flex gap-6 relative z-10">
                      <span className="w-7 h-7 min-w-[1.75rem] rounded-full bg-gray-900 text-white font-black flex items-center justify-center text-[10px] shadow-lg">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-gray-800 text-[15px] leading-relaxed font-medium pt-0.5">
                          {step}
                        </p>
                      </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Dica de Bancada */}
          {recipe.chefTip && (
            <div className="bg-emerald-50 border-2 border-emerald-100 p-7 rounded-[2.5rem] flex gap-5 mt-4 shadow-sm relative overflow-hidden">
              <span className="text-4xl filter drop-shadow-sm flex-shrink-0">👨‍🍳</span>
              <div className="relative z-10">
                <h4 className="font-black text-[10px] text-emerald-800 uppercase tracking-[0.2em] mb-1.5">Nota do Executivo</h4>
                <p className="text-sm text-emerald-900 font-bold leading-relaxed">{recipe.chefTip}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
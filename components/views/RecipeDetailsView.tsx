import React from 'react';
import { Recipe } from '../../types';
import { GoogleAdPlaceholder } from '../Layout';

interface RecipeDetailsViewProps {
  recipe: Recipe | null | undefined;
  isPremium: boolean;
  onBack: () => void;
}

export const RecipeDetailsView: React.FC<RecipeDetailsViewProps> = ({ recipe, isPremium, onBack }) => {
  // Verificação do Objeto Receita: Guard Clause para evitar erro crítico
  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-fadeIn">
        <span className="text-6xl mb-6">🔍</span>
        <h3 className="text-xl font-black text-gray-800">Receita não encontrada</h3>
        <p className="text-gray-400 text-sm mt-2 mb-8">O Chef não conseguiu recuperar os detalhes desta receita no momento.</p>
        <button 
          onClick={onBack}
          className="bg-chef-green text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-100 active:scale-95 transition-all"
        >
          Voltar e tentar novamente
        </button>
      </div>
    );
  }
  
  // Garantimos que arrays existam mesmo que a IA falhe em enviá-los
  const safeIngredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const safeInstructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];

  return (
    <div className="animate-slideUp space-y-6 px-4">
      <button onClick={onBack} className="text-gray-500 mb-2 hover:text-gray-800 no-print flex items-center gap-1 font-bold text-sm">
        <span>←</span> Voltar
      </button>
      
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100">
        <div className="bg-gradient-to-br from-chef-orange to-rose-500 p-8 text-white relative">
          <h2 className="text-2xl font-black pr-12 leading-tight drop-shadow-sm">{recipe.title || "Receita Sem Título"}</h2>
          <div className="flex gap-3 mt-5 text-[10px] font-black uppercase tracking-widest">
            <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">{recipe.prepTime || "Tempo ND"}</span>
            <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">{recipe.difficulty || "Dificuldade ND"}</span>
          </div>
          <button 
            onClick={() => window.print()} 
            className="absolute top-8 right-8 bg-white/20 p-2.5 rounded-2xl no-print hover:bg-white/30 transition-all border border-white/10 active:scale-90"
            title="Imprimir receita"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231a1.125 1.125 0 01-1.12-1.227L6.34 18m11.318-4.171a3 3 0 000-5.658L12 5.25 6.342 8.171a3 3 0 000 5.658m11.318 0l-.131.066m-11.187 0l.131.066" />
            </svg>
          </button>
        </div>

        <div className="p-8 space-y-8">
          {recipe.description && (
            <p className="text-gray-600 italic border-l-4 border-chef-orange pl-5 text-sm leading-relaxed font-medium">
              {recipe.description}
            </p>
          )}
          
          {isPremium && recipe.calories && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-6 grid grid-cols-4 gap-2 text-center shadow-inner">
              <div><div className="text-lg font-black text-emerald-700">{recipe.calories}</div><div className="text-[9px] text-emerald-600 font-bold uppercase">Kcal</div></div>
              <div><div className="text-lg font-black text-emerald-700">{recipe.macros?.protein || '-'}</div><div className="text-[9px] text-emerald-600 font-bold uppercase">Prot</div></div>
              <div><div className="text-lg font-black text-emerald-700">{recipe.macros?.carbs || '-'}</div><div className="text-[9px] text-emerald-600 font-bold uppercase">Carb</div></div>
              <div><div className="text-lg font-black text-emerald-700">{recipe.macros?.fat || '-'}</div><div className="text-[9px] text-emerald-600 font-bold uppercase">Gord</div></div>
            </div>
          )}

          {!isPremium && <GoogleAdPlaceholder />}

          <div>
            <h3 className="font-black text-gray-900 mb-5 text-[11px] uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Ingredientes</h3>
            <ul className="space-y-3">
                {safeIngredients.length > 0 ? (
                  safeIngredients.map((ing, i) => (
                    <li key={i} className="flex gap-4 text-gray-700 items-start group">
                        <div className="mt-1">
                          <input type="checkbox" className="w-5 h-5 accent-chef-orange rounded-lg border-gray-200 cursor-pointer" />
                        </div>
                        <span className="text-sm font-medium group-hover:text-gray-900 transition-colors">{ing}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-400 text-xs italic">Nenhum ingrediente listado.</p>
                )}
            </ul>
          </div>
          
          <hr className="border-gray-50" />
          
          <div>
            <h3 className="font-black text-gray-900 mb-6 text-[11px] uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Modo de Preparo</h3>
            <div className="space-y-6">
                {safeInstructions.length > 0 ? (
                  safeInstructions.map((step, i) => (
                    <div key={i} className="flex gap-5">
                        <span className="w-7 h-7 min-w-[1.75rem] rounded-xl bg-orange-100 text-chef-orange font-black flex items-center justify-center text-[10px] shadow-sm">
                          {i + 1}
                        </span>
                        <p className="text-gray-600 text-sm leading-relaxed font-medium">{step}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-xs italic">Nenhuma instrução fornecida.</p>
                )}
            </div>
          </div>

          {recipe.chefTip && (
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex gap-5 mt-4 shadow-sm">
              <span className="text-3xl filter drop-shadow-sm">👨‍🍳</span>
              <div>
                <h4 className="font-black text-[10px] text-amber-800 uppercase tracking-[0.2em] mb-1.5">Dica do Chef</h4>
                <p className="text-sm text-amber-900 font-bold italic leading-relaxed">{recipe.chefTip}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Recipe } from '../../types';
import { GoogleAdPlaceholder } from '../Layout';

interface RecipeDetailsViewProps {
  recipe: Recipe | null;
  isPremium: boolean;
  onBack: () => void;
}

export const RecipeDetailsView: React.FC<RecipeDetailsViewProps> = ({ recipe, isPremium, onBack }) => {
  if (!recipe) return null;
  
  return (
    <div className="animate-slideUp space-y-6">
      <button onClick={onBack} className="text-gray-500 mb-2 hover:text-gray-800 no-print flex items-center gap-1">
        <span>←</span> Voltar
      </button>
      
      <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100">
        <div className="bg-chef-orange p-6 text-white relative">
          <h2 className="text-2xl font-bold pr-12 leading-tight">{recipe.title}</h2>
          <div className="flex gap-4 mt-4 text-sm font-medium opacity-90">
            <span className="bg-white/20 px-3 py-1 rounded-full">{recipe.prepTime}</span>
            <span className="bg-white/20 px-3 py-1 rounded-full">{recipe.difficulty}</span>
          </div>
          <button onClick={() => window.print()} className="absolute top-6 right-6 bg-white/20 p-2 rounded-full no-print hover:bg-white/30 transition-colors">
            🖨️
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-gray-600 italic border-l-4 border-chef-orange pl-4 text-sm">{recipe.description}</p>
          
          {isPremium && recipe.calories && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 grid grid-cols-4 gap-2 text-center">
              <div><div className="text-lg font-bold text-green-700">{recipe.calories}</div><div className="text-[10px] text-green-600">Kcal</div></div>
              <div><div className="text-lg font-bold text-green-700">{recipe.macros?.protein}</div><div className="text-[10px] text-green-600">Prot</div></div>
              <div><div className="text-lg font-bold text-green-700">{recipe.macros?.carbs}</div><div className="text-[10px] text-green-600">Carb</div></div>
              <div><div className="text-lg font-bold text-green-700">{recipe.macros?.fat}</div><div className="text-[10px] text-green-600">Gord</div></div>
            </div>
          )}

          {!isPremium && <GoogleAdPlaceholder />}

          <div>
            <h3 className="font-bold text-gray-800 mb-3 text-chef-orange uppercase text-sm tracking-wide">Ingredientes</h3>
            <ul className="space-y-2">
                {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex gap-3 text-gray-700 items-start">
                        <input type="checkbox" className="mt-1.5 accent-chef-orange" />
                        <span>{ing}</span>
                    </li>
                ))}
            </ul>
          </div>
          
          <hr className="border-gray-100" />
          
          <div>
            <h3 className="font-bold text-gray-800 mb-3 text-chef-orange uppercase text-sm tracking-wide">Modo de Preparo</h3>
            <div className="space-y-4">
                {recipe.instructions.map((step, i) => (
                    <div key={i} className="flex gap-4">
                        <span className="w-6 h-6 min-w-[1.5rem] rounded-full bg-orange-100 text-chef-orange font-bold flex items-center justify-center text-sm">{i + 1}</span>
                        <p className="text-gray-600 text-sm leading-relaxed">{step}</p>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

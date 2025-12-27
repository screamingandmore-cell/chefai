import React, { useState, useCallback } from 'react';
import { Difficulty, DietGoal, DIET_GOALS, ViewState, UserProfile, Recipe } from '../../types';
import { IngredientInput } from '../shared/IngredientInput';

interface QuickRecipeViewProps {
  user: UserProfile | null;
  ingredients: string[];
  onAddIngredient: (items: string[]) => void;
  onRemoveIngredient: (index: number) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, autoGenerateParams?: { difficulty: Difficulty, goal: DietGoal }) => Promise<Recipe | null>;
  selectedDifficulty: Difficulty;
  setSelectedDifficulty: (d: Difficulty) => void;
  dietGoal: DietGoal;
  setDietGoal: (g: DietGoal) => void;
  onGenerateQuick: () => void;
  onRecipeGenerated: (r: Recipe) => void;
  isLoading: boolean;
  isPremium: boolean;
  onNavigate: (v: ViewState) => void;
  onUpdateAllergies: (input: string) => Promise<void>;
  onRemoveAllergy: (index: number) => Promise<void>;
}

export const QuickRecipeView: React.FC<QuickRecipeViewProps> = ({
  user,
  ingredients,
  onAddIngredient,
  onRemoveIngredient,
  onImageUpload,
  selectedDifficulty,
  setSelectedDifficulty,
  dietGoal,
  setDietGoal,
  onGenerateQuick,
  onRecipeGenerated,
  isLoading,
  isPremium,
  onNavigate,
  onUpdateAllergies,
  onRemoveAllergy
}) => {
  const [allergyInput, setAllergyInput] = useState('');
  const hasIngredients = ingredients.length > 0;

  const handleAddAllergy = async () => {
    const val = allergyInput.trim();
    if (!val) return;

    // Suporte para múltiplos itens via Enter
    const items = val.split(/[,;]/).map(i => i.trim()).filter(i => i.length > 0);
    for (const item of items) {
      await onUpdateAllergies(item);
    }
    setAllergyInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAllergy();
    }
  };

  const handleCameraCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const recipe = await onImageUpload(e, { difficulty: selectedDifficulty, goal: dietGoal });
    if (recipe) {
      onRecipeGenerated(recipe);
    }
  }, [onImageUpload, selectedDifficulty, dietGoal, onRecipeGenerated]);

  return (
    <div className="space-y-8 relative animate-slideUp">
      <div className="px-2">
        <button 
          onClick={() => onNavigate(ViewState.HOME)}
          className="text-gray-400 font-bold text-xs flex items-center gap-2 mb-4 hover:text-gray-900 transition-colors"
        >
          <span>←</span> Início
        </button>
        <h3 className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.2em] mb-1 font-sans">IA na Cozinha</h3>
        <h2 className="font-heading text-3xl font-black text-gray-900 leading-tight">Receita Rápida ⚡</h2>
      </div>

      <div className="bg-white p-7 rounded-[2.5rem] shadow-soft border border-gray-100/50">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-1">O que temos para hoje?</p>
        <IngredientInput 
          ingredients={ingredients}
          onAdd={onAddIngredient}
          onRemove={onRemoveIngredient}
          onImageUpload={handleCameraCapture}
          isLoading={isLoading}
          isPremium={isPremium}
        />
      </div>

      <div className="bg-white p-7 rounded-[2.5rem] shadow-soft border border-gray-100/50">
        <div className="flex items-center gap-2 mb-2 px-1">
          <p className="text-[11px] font-bold text-red-400 uppercase tracking-widest">Restrições e Alergias 🚫</p>
        </div>
        <p className="text-[10px] text-gray-400 mb-6 px-1 leading-tight">Itens que o Chef nunca deve usar.</p>
        
        <div className="flex gap-2 mb-6">
          <input 
            value={allergyInput}
            onChange={(e) => setAllergyInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: Camarão, Glúten..."
            maxLength={500}
            className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-red-100 outline-none font-medium"
          />
          <button 
            onClick={handleAddAllergy} 
            className="bg-red-50 text-red-500 w-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-sm active:scale-90 transition-transform border border-red-100"
          >
            +
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2.5 min-h-[40px] content-start">
          {user?.allergies?.length === 0 && (
            <p className="w-full text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest py-4">Nenhuma restrição</p>
          )}
          {user?.allergies?.map((allergy, i) => (
            <span key={i} className="bg-red-50 text-red-600 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2 border border-red-100 animate-fadeIn shadow-sm">
              <span className="max-w-[150px] truncate">{allergy}</span>
              <button 
                onClick={() => onRemoveAllergy(i)} 
                className="ml-1 opacity-50 hover:opacity-100 text-lg font-black"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-soft space-y-10">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-1">Seu Objetivo</p>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(DIET_GOALS) as DietGoal[]).map((goal) => {
               const isChefChoice = goal === 'chef_choice';
               const isSelected = dietGoal === goal;
               
               let buttonStyle = isSelected 
                 ? 'border-chef-green bg-emerald-50 text-chef-green shadow-md' 
                 : 'border-gray-50 bg-gray-50/50 text-gray-400';
               
               if (isChefChoice && isSelected) {
                 buttonStyle = 'border-amber-500 bg-yellow-100 text-amber-800 shadow-lg shadow-amber-100/50 scale-105';
               }

               return (
                 <button 
                   key={goal}
                   onClick={() => setDietGoal(goal)}
                   className={`p-4 rounded-[1.5rem] border-2 text-center transition-all relative overflow-hidden active:scale-95 ${buttonStyle}`}
                 >
                   <span className="font-black text-[10px] uppercase tracking-wider">
                     {DIET_GOALS[goal]}
                   </span>
                 </button>
               );
            })}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5 px-1">Dificuldade</p>
          <div className="flex bg-gray-100/50 rounded-2xl p-1.5 border border-gray-100 shadow-inner">
            {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map((diff) => (
              <button 
                key={diff} 
                onClick={() => setSelectedDifficulty(diff)} 
                className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
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
      </div>

      <div className="px-2">
        <button 
          onClick={onGenerateQuick} 
          disabled={isLoading || !hasIngredients} 
          className="w-full bg-gradient-to-r from-chef-orange to-rose-500 text-white font-black py-6 rounded-[2rem] shadow-xl shadow-orange-100 hover:brightness-105 disabled:opacity-30 transition-all active:scale-95 text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Preparando...</span>
            </div>
          ) : (
            <><span>🍳</span> Gerar Receita Agora</>
          )}
        </button>
      </div>
    </div>
  );
};
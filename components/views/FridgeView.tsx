import React, { useState } from 'react';
import { ViewState, UserProfile, DietGoal, DIET_GOALS } from '../../types';
import { IngredientInput } from '../shared/IngredientInput';

interface FridgeViewProps {
  user: UserProfile | null;
  ingredients: string[];
  onAddIngredient: (items: string[]) => void;
  onRemoveIngredient: (index: number) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dietGoal: DietGoal;
  setDietGoal: (g: DietGoal) => void;
  isLoading: boolean;
  isPremium: boolean;
  onNavigate: (view: ViewState) => void;
  onGenerateQuick: () => void;
  onGenerateWeekly: () => void;
  onUpdateAllergies: (input: string) => Promise<void>; // Alias para handleUpdateAllergies
  onRemoveAllergy: (index: number) => Promise<void>;
}

export const FridgeView: React.FC<FridgeViewProps> = ({
  user,
  ingredients,
  onAddIngredient,
  onRemoveIngredient,
  onImageUpload,
  dietGoal,
  setDietGoal,
  isLoading,
  isPremium,
  onNavigate,
  onGenerateQuick,
  onGenerateWeekly,
  onUpdateAllergies,
  onRemoveAllergy
}) => {
  const [allergyInput, setAllergyInput] = useState('');
  const hasIngredients = ingredients.length > 0;

  const handleAction = (action: () => void) => {
    if (!hasIngredients) {
      alert("Sua geladeira está vazia! Adicione alguns ingredientes primeiro.");
      return;
    }
    action();
  };

  const handleAddAllergy = async () => {
    const val = allergyInput.trim();
    if (!val) return;
    await onUpdateAllergies(val);
    setAllergyInput('');
  };

  return (
    <div className="space-y-8 relative animate-slideUp pb-20">
      <div className="px-2">
        <button 
          onClick={() => onNavigate(ViewState.HOME)}
          className="text-gray-400 font-bold text-xs flex items-center gap-2 mb-4 hover:text-gray-900 transition-colors"
        >
          <span>←</span> Início
        </button>
        <h3 className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.2em] mb-1 font-sans">Estoque de Alimentos</h3>
        <h2 className="font-heading text-3xl font-black text-gray-900 leading-tight">Minha Geladeira ❄️</h2>
      </div>

      <div className="bg-white p-7 rounded-[2.5rem] shadow-soft border border-gray-100/50">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-1">O que você tem disponível?</p>
        <IngredientInput 
          ingredients={ingredients}
          onAdd={onAddIngredient}
          onRemove={onRemoveIngredient}
          onImageUpload={onImageUpload}
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
            onKeyDown={(e) => e.key === 'Enter' && handleAddAllergy()}
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
            <span key={i} className="bg-red-50 text-red-600 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2 border border-red-100 animate-fadeIn">
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

      <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-soft">
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

      <div className="px-2 space-y-3">
        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ações Rápidas</p>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => handleAction(onGenerateQuick)}
            disabled={isLoading}
            className={`font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest border transition-all active:scale-95 flex items-center justify-center gap-2 ${
              isLoading 
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                : 'bg-chef-orange/10 text-chef-orange border-chef-orange/20 hover:bg-chef-orange/20'
            }`}
          >
            {isLoading ? (
              <><div className="w-3 h-3 border-2 border-chef-orange border-t-transparent rounded-full animate-spin"></div> Gerando...</>
            ) : (
              <>⚡ Receita Rápida</>
            )}
          </button>
          <button 
            onClick={() => handleAction(onGenerateWeekly)}
            disabled={isLoading}
            className={`font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest border transition-all active:scale-95 flex items-center justify-center gap-2 ${
              isLoading 
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                : 'bg-chef-green/10 text-chef-green border-chef-green/20 hover:bg-chef-green/20'
            }`}
          >
            {isLoading ? (
              <><div className="w-3 h-3 border-2 border-chef-green border-t-transparent rounded-full animate-spin"></div> Planejando...</>
            ) : (
              <>📅 Plano Semanal</>
            )}
          </button>
        </div>
      </div>
      <div className="w-full h-32 md:h-40 flex-shrink-0" aria-hidden="true"></div>
    </div>
  );
};
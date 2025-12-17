
import React from 'react';
import { Difficulty } from '../../types';
import { IngredientInput } from '../shared/IngredientInput';

interface FridgeViewProps {
  ingredients: string[];
  onAddIngredient: (items: string[]) => void;
  onRemoveIngredient: (index: number) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedDifficulty: Difficulty;
  setSelectedDifficulty: (d: Difficulty) => void;
  onGenerateQuick: () => void;
  onGenerateWeekly: () => void;
  isLoading: boolean;
  isPremium: boolean;
  error: string | null;
  onErrorDismiss: () => void;
}

export const FridgeView: React.FC<FridgeViewProps> = ({
  ingredients,
  onAddIngredient,
  onRemoveIngredient,
  onImageUpload,
  selectedDifficulty,
  setSelectedDifficulty,
  onGenerateQuick,
  onGenerateWeekly,
  isLoading,
  isPremium,
  error,
  onErrorDismiss
}) => {
  return (
    <div className="space-y-6 relative animate-slideUp">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Minha Geladeira ❄️</h2>
        <IngredientInput 
          ingredients={ingredients}
          onAdd={onAddIngredient}
          onRemove={onRemoveIngredient}
          onImageUpload={onImageUpload}
          isLoading={isLoading}
          isPremium={isPremium}
        />
      </div>
      
      <div className="bg-white p-4 rounded-xl border border-gray-200 relative z-10">
        <p className="text-xs font-bold text-gray-500 uppercase mb-3">Dificuldade</p>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map((diff) => (
            <button 
              key={diff} 
              onClick={() => setSelectedDifficulty(diff)} 
              className={`flex-1 py-2 rounded-md text-xs font-bold transition-colors ${
                selectedDifficulty === diff 
                  ? 'bg-chef-green text-white shadow-md' 
                  : 'text-gray-400 hover:bg-gray-200'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 flex justify-between items-center animate-bounce">
          <span>{error}</span>
          <button onClick={onErrorDismiss}>×</button>
        </div>
      )}
      
      <div className="h-64 w-full"></div>

      <div className="fixed bottom-24 left-4 right-4 z-[100] max-w-[calc(28rem-2rem)] sm:mx-auto">
         <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/40">
           <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={onGenerateQuick} 
                disabled={isLoading} 
                className="bg-chef-orange text-white font-bold py-4 rounded-xl shadow-md hover:bg-orange-600 disabled:opacity-50 border border-white/20 active:scale-95 transition-transform"
              >
                {isLoading ? '...' : 'Receita Rápida'}
              </button>
              <button 
                onClick={onGenerateWeekly} 
                disabled={isLoading} 
                className="bg-chef-green text-white font-bold py-4 rounded-xl shadow-md hover:bg-green-600 disabled:opacity-50 border border-white/20 active:scale-95 transition-transform"
              >
                {isLoading ? '...' : 'Semanal'}
              </button>
           </div>
         </div>
      </div>
    </div>
  );
};

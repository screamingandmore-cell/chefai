
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
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
           <div className="bg-emerald-100 p-3 rounded-2xl text-2xl">❄️</div>
           <h2 className="text-2xl font-black text-gray-800">Minha Geladeira</h2>
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
      
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Como quer cozinhar hoje?</p>
        <div className="flex bg-gray-50 rounded-2xl p-1.5 border border-gray-100">
          {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map((diff) => (
            <button 
              key={diff} 
              onClick={() => setSelectedDifficulty(diff)} 
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedDifficulty === diff 
                  ? 'bg-chef-green text-white shadow-lg scale-[1.05]' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-5 rounded-2xl text-[10px] font-black border border-red-100 flex justify-between items-center animate-pulse uppercase tracking-widest">
          <span>{error}</span>
          <button onClick={onErrorDismiss} className="text-lg">×</button>
        </div>
      )}
      
      <div className="h-40 w-full"></div>

      <div className="fixed bottom-24 left-6 right-6 z-[100] max-w-[calc(28rem-3rem)] sm:mx-auto">
         <div className="bg-white/90 backdrop-blur-2xl p-4 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/50">
           <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={onGenerateQuick} 
                disabled={isLoading || ingredients.length === 0} 
                className="bg-orange-500 text-white font-black py-5 rounded-[2rem] shadow-lg hover:bg-orange-600 disabled:opacity-30 disabled:grayscale transition-all active:scale-95 text-[10px] uppercase tracking-widest"
              >
                {isLoading ? '...' : 'Receita Vapt-Vupt'}
              </button>
              <button 
                onClick={onGenerateWeekly} 
                disabled={isLoading || ingredients.length === 0} 
                className="bg-gray-900 text-white font-black py-5 rounded-[2rem] shadow-lg hover:bg-black disabled:opacity-30 disabled:grayscale transition-all active:scale-95 text-[10px] uppercase tracking-widest"
              >
                {isLoading ? '...' : 'Plano Semanal'}
              </button>
           </div>
         </div>
      </div>
    </div>
  );
};

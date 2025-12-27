import React, { useState, useRef, memo, useCallback } from 'react';

interface IngredientInputProps {
  ingredients: string[];
  onAdd: (newIngredients: string[]) => void;
  onRemove: (index: number) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  isPremium: boolean;
}

const EMOJI_MAP: Record<string, string> = {
  frango: '🐔', arroz: '🍚', carne: '🥩', ovo: '🥚', batata: '🥔', cenoura: '🥕', tomate: '🍅',
  peixe: '🐟', leite: '🥛', pão: '🍞', macarrão: '🍝', queijo: '🧀', cebola: '🧅', alho: '🧄',
  sal: '🧂', pimenta: '🌶️', feijão: '🫘', alface: '🥬', brócolis: '🥦', milho: '🌽', limão: '🍋',
  maçã: '🍎', banana: '🍌', azeite: '🫗', açúcar: '🍬', manteiga: '🧈', mel: '🍯', berinjela: '🍆',
  cogumelo: '🍄'
};

const getEmojiForIngredient = (name: string): string => {
  const lower = name.toLowerCase().trim();
  for (const key in EMOJI_MAP) {
    if (lower.includes(key)) return EMOJI_MAP[key];
  }
  return '';
};

const TAG_COLORS = [
  'bg-orange-50 text-orange-700 border-orange-100',
  'bg-emerald-50 text-emerald-700 border-emerald-100',
  'bg-blue-50 text-blue-700 border-blue-100',
  'bg-rose-50 text-rose-700 border-rose-100',
  'bg-amber-50 text-amber-700 border-amber-100'
];

export const IngredientInput = memo(({
  ingredients,
  onAdd,
  onRemove,
  onImageUpload,
  isLoading,
  isPremium
}: IngredientInputProps) => {
  const [currentIngredient, setCurrentIngredient] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processInput = useCallback(() => {
    const input = currentIngredient.trim();
    if (!input) return;
    
    const items: string[] = [];
    let current = "";
    let depth = 0;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (char === '(') depth++;
      else if (char === ')') depth--;

      if (char === '\n' || char === ';') {
        if (current.trim()) items.push(current.trim());
        current = "";
        depth = 0;
      } else if (char === ',' && depth <= 0) {
        if (current.trim()) items.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim()) items.push(current.trim());

    const finalItems = items
      .map(s => s.trim())
      .filter(s => s.length >= 1 && s.length <= 500);

    if (finalItems.length > 0) {
      onAdd(finalItems);
      setCurrentIngredient('');
    }
  }, [currentIngredient, onAdd]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processInput();
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-4">
        <input 
          id="ingredient-input"
          aria-label="Adicionar ingrediente"
          maxLength={500}
          value={currentIngredient} 
          onChange={(e) => setCurrentIngredient(e.target.value)} 
          onKeyDown={handleKeyDown} 
          placeholder="Ex: Frango, Batata, Cenoura..." 
          className="flex-1 bg-gray-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-chef-green text-base shadow-inner font-medium placeholder:text-gray-300" 
        />
        <button 
          onClick={processInput} 
          aria-label="Adicionar"
          type="button"
          className="bg-chef-green text-white w-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg shadow-emerald-100 active:scale-90 transition-transform"
        >
          +
        </button>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          ref={fileInputRef} 
          className="hidden" 
          onChange={onImageUpload} 
        />
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()} 
          disabled={isLoading}
          className={`flex-1 py-3.5 rounded-2xl border flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-[0.98] ${
            isPremium 
              ? 'border-chef-green text-chef-green bg-emerald-50/50 shadow-sm' 
              : 'border-gray-200 text-gray-400 bg-gray-50'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-chef-green border-t-transparent rounded-full animate-spin"></div>
              <span>Chef analisando...</span>
            </div>
          ) : (
            <>
              <span>{isPremium ? '📸' : '🔒'}</span>
              <span>Abrir Câmera</span>
            </>
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-2.5 min-h-[50px] content-start">
        {ingredients.length === 0 && !isLoading && (
          <div className="w-full flex flex-col items-center py-6 opacity-30">
            <span className="text-4xl mb-2">🥗</span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-center">Digite ou tire foto dos itens</p>
          </div>
        )}
        {ingredients.map((ing, i) => {
          const emoji = getEmojiForIngredient(ing);
          const colorClass = TAG_COLORS[i % TAG_COLORS.length];
          return (
            <span 
              key={`${ing}-${i}`} 
              className={`${colorClass} px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2 animate-fadeIn border shadow-sm transition-transform active:scale-95`}
            >
              {emoji && <span className="text-sm grayscale-0">{emoji}</span>}
              <span className="max-w-[200px] truncate">{ing}</span>
              <button 
                onClick={() => onRemove(i)} 
                className="ml-1 opacity-50 hover:opacity-100 text-lg font-black w-6 h-6 flex items-center justify-center relative z-10"
                aria-label={`Remover ${ing}`}
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
});

IngredientInput.displayName = 'IngredientInput';
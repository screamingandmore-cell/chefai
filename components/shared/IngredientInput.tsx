
import React, { useState, useRef } from 'react';

interface IngredientInputProps {
  ingredients: string[];
  onAdd: (newIngredients: string[]) => void;
  onRemove: (index: number) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  isPremium: boolean;
}

export const IngredientInput: React.FC<IngredientInputProps> = ({
  ingredients,
  onAdd,
  onRemove,
  onImageUpload,
  isLoading,
  isPremium
}) => {
  const [currentIngredient, setCurrentIngredient] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processInput = () => {
    if (!currentIngredient.trim()) return;
    const newItems = currentIngredient.split(/[,;\n]+/).map(s => s.trim()).filter(s => s.length > 0);
    if (newItems.length > 0) {
      onAdd(newItems);
      setCurrentIngredient('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') processInput();
  };

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-4">
        <label htmlFor="ingredient-input" className="sr-only">Digite um ingrediente</label>
        <input 
          id="ingredient-input"
          aria-label="Adicionar ingrediente"
          maxLength={40}
          value={currentIngredient} 
          onChange={(e) => setCurrentIngredient(e.target.value)} 
          onKeyDown={handleKeyDown} 
          placeholder="Ex: Frango, Batata, Arroz..." 
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-chef-green" 
        />
        <button 
          onClick={processInput} 
          aria-label="Adicionar"
          className="bg-chef-green text-white px-4 rounded-xl hover:bg-green-600 font-bold"
        >
          +
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <input type="file" accept="image/*" multiple ref={fileInputRef} className="hidden" onChange={onImageUpload} />
        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={isLoading}
          className={`flex-1 py-2 rounded-lg border border-dashed flex items-center justify-center gap-2 text-sm transition-colors ${
            isPremium 
              ? 'border-chef-green text-chef-green bg-green-50 hover:bg-green-100' 
              : 'border-gray-300 text-gray-400 bg-gray-50 hover:bg-gray-100'
          }`}
        >
          {isLoading ? (
            <span className="animate-pulse">Processando imagem...</span>
          ) : (
            <><span>📷</span> {isPremium ? 'Analisar Fotos (IA)' : 'Foto (Premium)'}</>
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[50px] content-start">
        {ingredients.length === 0 && (
          <p className="text-gray-400 text-sm w-full text-center py-2 italic">
            Sua lista está vazia. Adicione o que tem em casa!
          </p>
        )}
        {ingredients.map((ing, i) => (
          <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 animate-fadeIn">
            {ing} 
            <button onClick={() => onRemove(i)} className="text-gray-400 hover:text-red-500 font-bold px-1">×</button>
          </span>
        ))}
      </div>
    </div>
  );
};


import React, { useState, useCallback, memo } from 'react';
import { WeeklyMenu } from '../../types';

interface ShoppingItemProps {
  item: string;
  isChecked: boolean;
  onToggle: (item: string) => void;
}

const ShoppingItem = memo(({ item, isChecked, onToggle }: ShoppingItemProps) => (
  <div 
    onClick={() => onToggle(item)}
    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
      isChecked 
        ? 'bg-gray-50 border-gray-100 opacity-50' 
        : 'bg-white border-gray-100 hover:border-chef-green shadow-sm'
    }`}
  >
    <div className={`w-6 h-6 min-w-[1.5rem] rounded-full border-2 flex items-center justify-center transition-all ${
      isChecked ? 'bg-chef-green border-chef-green' : 'border-gray-200'
    }`}>
      {isChecked && <span className="text-white text-[10px] font-bold">✓</span>}
    </div>
    <span className={`flex-1 text-gray-700 font-medium ${isChecked ? 'line-through' : ''}`}>
      {item}
    </span>
  </div>
));

ShoppingItem.displayName = 'ShoppingItem';

interface ShoppingListViewProps {
  menu: WeeklyMenu | null;
  onBack: () => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({ menu, onBack }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleItem = useCallback((item: string) => {
    setCheckedItems(prev => ({ ...prev, [item]: !prev[item] }));
  }, []);

  if (!menu) return null;

  const shareList = () => {
    const text = `🛒 *Lista de Compras Chef.ai*\n\n${menu.shoppingList.map(item => `- ${item}`).join('\n')}\n\nGerado automaticamente pelo Chef.ai`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="animate-slideUp space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-gray-500 flex items-center gap-1 hover:text-gray-800 transition-all font-medium">
          <span>←</span> Voltar ao Plano
        </button>
        <button 
          onClick={shareList}
          className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-700 shadow-md transition-all active:scale-95"
        >
          <span>💬</span> WhatsApp
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Minha Lista</h2>
          <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">Itens necessários para a semana</p>
        </div>

        <div className="space-y-3">
          {menu.shoppingList.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-5xl block mb-4">✨</span>
              <p className="text-gray-500 font-bold">Você tem tudo em casa!</p>
              <p className="text-xs text-gray-400 mt-1">Nenhum item extra necessário.</p>
            </div>
          ) : (
            menu.shoppingList.map((item, idx) => (
              <ShoppingItem 
                key={`${idx}-${item}`}
                item={item}
                isChecked={!!checkedItems[item]}
                onToggle={toggleItem}
              />
            ))
          )}
        </div>

        <div className="mt-8 bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex gap-4">
          <span className="text-2xl">💡</span>
          <div>
            <p className="text-[10px] text-blue-700 font-black uppercase tracking-widest mb-1">Dica de Economia</p>
            <p className="text-xs text-blue-600 leading-relaxed font-medium">
              Compre itens a granel ou em embalagens maiores para os ingredientes que aparecem em múltiplas receitas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

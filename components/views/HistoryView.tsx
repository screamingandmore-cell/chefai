import React, { memo } from 'react';
import { WeeklyMenu, DIET_GOALS, DietGoal } from '../../types';

interface HistoryItemProps {
  menu: WeeklyMenu;
  onSelect: (menu: WeeklyMenu) => void;
  onDelete: (id: string) => void;
}

const HistoryItem = memo(({ menu, onSelect, onDelete }: HistoryItemProps) => (
  <div 
    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
    onClick={() => onSelect(menu)}
  >
    <div className="flex-1">
      <p className="font-bold text-gray-800 text-lg capitalize">
        {new Date(menu.createdAt).toLocaleDateString('pt-BR', { weekday: 'long' })}
      </p>
      <p className="text-xs text-gray-400">
        {new Date(menu.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
      </p>
      <div className="flex gap-2 mt-3">
        <span className="text-[9px] bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider">
          {menu.days?.length || 0} Dias
        </span>
        {menu.goal && (
          <span className="text-[9px] bg-green-50 text-chef-green px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider border border-green-100">
            {DIET_GOALS[menu.goal as DietGoal] || menu.goal}
          </span>
        )}
      </div>
    </div>
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onDelete(menu.id);
      }}
      className="p-3 text-gray-200 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
      title="Excluir"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    </button>
  </div>
));

HistoryItem.displayName = 'HistoryItem';

interface HistoryViewProps {
  menus: WeeklyMenu[];
  onSelect: (menu: WeeklyMenu) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ menus, onSelect, onDelete, onBack }) => {
  return (
    <div className="animate-slideUp space-y-6">
      <button 
        onClick={onBack} 
        className="text-gray-500 flex items-center gap-1 hover:text-gray-800 transition-all font-bold text-sm px-2"
      >
        <span>←</span> Voltar
      </button>

      <div className="mb-2 px-2">
        <h2 className="text-2xl font-bold text-gray-800">Histórico de Planos</h2>
        <p className="text-sm text-gray-400">Cardápios salvos na sua conta.</p>
      </div>

      <div className="space-y-4 pb-10 px-2">
        {menus.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-dashed border-gray-200 text-center">
            <span className="text-5xl block mb-6">🗓️</span>
            <p className="text-gray-400 font-bold">Nenhum cardápio salvo.</p>
            <p className="text-xs text-gray-300 mt-2">Crie seu primeiro plano na aba Semanal.</p>
          </div>
        ) : (
          menus.map((menu) => (
            <HistoryItem 
              key={menu.id}
              menu={menu}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};
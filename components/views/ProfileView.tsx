
import React from 'react';
import { ViewState, UserProfile } from '../../types';

const STRIPE_PORTAL_URL = import.meta.env.VITE_STRIPE_PORTAL_URL || 'https://billing.stripe.com/p/login/SEU_LINK_AQUI';

interface ProfileViewProps {
  user: UserProfile | null;
  session: any;
  onLogout: () => void;
  onUpdateUser: (u: UserProfile | null) => void;
  onDeleteAccount: () => void;
  onNavigate: (view: ViewState) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, session, onLogout, onDeleteAccount, onNavigate }) => {
  const menuItems = [
    { 
      label: 'Histórico de Planos', 
      icon: '🕒', 
      action: () => onNavigate(ViewState.MENU_HISTORY) 
    },
    { 
      label: 'Termos e Privacidade', 
      icon: '📜', 
      action: () => window.open('https://chefai-zl8v.vercel.app/privacy.html', '_blank') 
    },
    { 
      label: 'Sair da Conta', 
      icon: '🚪', 
      action: onLogout,
      danger: true 
    }
  ];

  return (
    <div className="space-y-8 animate-slideUp pb-10">
       {/* Cabeçalho Centralizado */}
       <div className="flex flex-col items-center pt-6 px-4">
         <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-soft border-4 border-white mb-4">
           👤
         </div>
         <h2 className="font-heading text-xl font-black text-gray-900 truncate max-w-full">
           {session?.user?.email?.split('@')[0]}
         </h2>
         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
           {session?.user?.email}
         </p>
       </div>

       {/* Status Premium Compacto */}
       <div className="px-2">
         <div className={`p-6 rounded-[2.5rem] border shadow-soft flex items-center justify-between transition-all ${
           user?.isPremium ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100'
         }`}>
           <div className="flex items-center gap-4">
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
               user?.isPremium ? 'bg-amber-100' : 'bg-gray-50'
             }`}>
               {user?.isPremium ? '👑' : '🔥'}
             </div>
             <div>
               <h3 className="font-black text-gray-900 text-sm">
                 {user?.isPremium ? 'Assinante Premium' : 'Plano Gratuito'}
               </h3>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                 {user?.isPremium ? 'Acesso total liberado' : 'Funcionalidades limitadas'}
               </p>
             </div>
           </div>
           
           {user?.isPremium ? (
             <button 
               onClick={() => window.location.href = STRIPE_PORTAL_URL}
               className="bg-white border border-amber-200 text-amber-600 p-2.5 rounded-xl shadow-sm hover:bg-amber-50 transition-colors"
             >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-9.75 0h9.75" />
               </svg>
             </button>
           ) : (
             <button 
               onClick={() => onNavigate(ViewState.PREMIUM)}
               className="bg-amber-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-100 active:scale-95 transition-all"
             >
               Upgrade
             </button>
           )}
         </div>
       </div>

       {/* Menu de Opções Estilo Lista */}
       <div className="px-2">
         <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-soft overflow-hidden">
            {menuItems.map((item, idx) => (
              <button 
                key={idx}
                onClick={item.action}
                className={`w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-all border-b border-gray-50 last:border-0 ${item.danger ? 'text-red-500' : 'text-gray-700'}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 opacity-30">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ))}
         </div>
       </div>

       <div className="text-center pt-4">
         <button 
          onClick={onDeleteAccount} 
          className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em] hover:text-red-400 transition-colors"
         >
           Excluir conta permanentemente
         </button>
         <p className="text-[9px] text-gray-300 mt-2 font-bold">Chef.ai v1.2.0 • 2025</p>
       </div>
    </div>
  );
};

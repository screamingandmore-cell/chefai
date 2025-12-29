
import React from 'react';
import { ViewState, UserProfile } from '../../types';

const STRIPE_PORTAL_URL = (import.meta as any).env.VITE_STRIPE_PORTAL_URL || 'https://billing.stripe.com/p/login/SEU_LINK_AQUI';

interface ProfileViewProps {
  user: UserProfile | null;
  session: any;
  onLogout: () => void;
  onUpdateUser: (u: UserProfile | null) => void;
  onDeleteAccount: () => void;
  onNavigate: (view: ViewState) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, session, onLogout, onDeleteAccount, onNavigate }) => {
  return (
    <div className="flex flex-col min-h-full pb-32 animate-slideUp px-4">
       <div className="flex flex-col items-center pt-6 mb-8">
         <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-soft border-4 border-white mb-4">👤</div>
         <h2 className="font-heading text-xl font-black text-gray-900 truncate max-w-full">{session?.user?.email?.split('@')[0]}</h2>
         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{session?.user?.email}</p>
       </div>
       <div className={`p-6 rounded-[2.5rem] border shadow-soft flex items-center justify-between transition-all mb-8 ${user?.isPremium ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100'}`}>
         <div className="flex items-center gap-4">
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${user?.isPremium ? 'bg-amber-100' : 'bg-gray-50'}`}>{user?.isPremium ? '👑' : '🔥'}</div>
           <div>
             <h3 className="font-black text-gray-900 text-sm">{user?.isPremium ? 'Assinante Premium' : 'Plano Gratuito'}</h3>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{user?.isPremium ? 'Acesso total liberado' : 'Funcionalidades limitadas'}</p>
           </div>
         </div>
         {user?.isPremium ? (
           <button onClick={() => window.location.href = STRIPE_PORTAL_URL} className="bg-white border border-amber-200 text-amber-600 p-2.5 rounded-xl shadow-sm hover:bg-amber-50 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-9.75 0h9.75" /></svg></button>
         ) : (
           <button onClick={() => onNavigate(ViewState.PREMIUM)} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-100 active:scale-95 transition-all">Upgrade</button>
         )}
       </div>
       <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-soft overflow-hidden mb-12">
          <button onClick={() => onNavigate(ViewState.MENU_HISTORY)} className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-all border-b border-gray-50">
            <div className="flex items-center gap-4"><span className="text-xl text-gray-400">🕒</span><span className="font-bold text-sm text-gray-700">Histórico de Planos</span></div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 opacity-30"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
          <button onClick={onLogout} className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-all group">
            <div className="flex items-center gap-4"><span className="text-xl text-gray-400 group-hover:text-red-400 transition-colors">🚪</span><span className="font-bold text-sm text-gray-700 group-hover:text-red-500 transition-colors">Sair da Conta</span></div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 opacity-30"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
       </div>
       <div className="mt-auto pt-8 border-t border-gray-50 text-center">
          <div className="flex justify-center gap-6 mb-6">
            <button onClick={() => onNavigate(ViewState.TERMS)} className="text-[10px] text-gray-400 font-black uppercase tracking-widest hover:text-chef-green transition-colors">Termos</button>
            <button onClick={() => onNavigate(ViewState.PRIVACY)} className="text-[10px] text-gray-400 font-black uppercase tracking-widest hover:text-chef-green transition-colors">Privacidade</button>
          </div>
          <div className="pb-4">
            <button onClick={() => { if (confirm("Tem certeza que deseja excluir sua conta permanentemente? Esta ação é irreversível.")) { onDeleteAccount(); } }} className="text-red-400 hover:text-red-600 font-black text-[10px] uppercase tracking-[0.2em] transition-colors">Excluir Minha Conta</button>
            <p className="text-[9px] text-gray-300 font-bold tracking-[0.3em] mt-6">Chef.ai v1.3.0</p>
          </div>
       </div>
    </div>
  );
};

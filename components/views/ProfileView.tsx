
import React, { useState } from 'react';
import { UserProfile } from '../../types';
import * as SupabaseService from '../../services/supabase';

const STRIPE_PORTAL_URL = import.meta.env.VITE_STRIPE_PORTAL_URL || 'https://billing.stripe.com/p/login/SEU_LINK_AQUI';

interface ProfileViewProps {
  user: UserProfile | null;
  session: any;
  onLogout: () => void;
  onUpdateUser: (u: UserProfile | null) => void;
  onDeleteAccount: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, session, onLogout, onUpdateUser, onDeleteAccount }) => {
  const [allergyInput, setAllergyInput] = useState('');

  const sanitizeInput = (text: string) => {
    // Remove caracteres especiais que podem ser usados para injeção ou quebrar o layout
    return text.replace(/[<>{}\[\]\\\/|*&^%$#@!]/g, '').trim();
  };

  const handleAddAllergy = async () => {
    if (!allergyInput.trim() || !user || !session?.user) return;
    
    // Divide a entrada caso o usuário digite vários itens separados por vírgula ou ponto e vírgula
    const rawItems = allergyInput.split(/[,;\n]+/);
    
    const newSanitizedAllergies = rawItems
      .map(item => sanitizeInput(item))
      .filter(item => 
        item.length > 1 && 
        item.length <= 30 && 
        !user.allergies.includes(item)
      );

    if (newSanitizedAllergies.length === 0) {
      setAllergyInput('');
      return;
    }

    const updatedAllergies = [...(user.allergies || []), ...newSanitizedAllergies];
    const updatedUser = { ...user, allergies: updatedAllergies };
    
    // Atualização otimista na UI
    onUpdateUser(updatedUser);
    setAllergyInput('');
    
    // Sincronização com o banco de dados
    try {
      await SupabaseService.updatePreferences(session.user.id, updatedUser.allergies);
    } catch (error) {
      console.error("Erro ao salvar preferências:", error);
      // Aqui poderíamos reverter o estado se necessário, mas para UX simplificada mantemos o log
    }
  };

  const handleRemoveAllergy = async (index: number) => {
    if (!user || !session?.user) return;
    const updatedAllergies = user.allergies.filter((_, i) => i !== index);
    const updatedUser = { ...user, allergies: updatedAllergies };
    
    onUpdateUser(updatedUser);
    await SupabaseService.updatePreferences(session.user.id, updatedUser.allergies);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAllergy();
    }
  };

  return (
    <div className="space-y-6 animate-slideUp">
       <div className="flex justify-between items-end">
         <div>
           <h2 className="text-2xl font-bold text-gray-800">Meu Perfil</h2>
           <p className="text-sm text-gray-500">Gerencie sua conta e restrições</p>
         </div>
         {user?.isPremium && (
           <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200">
             Premium 👑
           </span>
         )}
       </div>

       <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-xl shadow-inner">👤</div>
             <div>
               <p className="font-bold text-gray-800 break-all">{session?.user?.email}</p>
               <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Membro desde {new Date(session?.user?.created_at).toLocaleDateString()}</p>
             </div>
           </div>
       </div>
       
       <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
         <h3 className="font-bold mb-1 text-gray-700 flex items-center gap-2">
           <span className="text-red-500">⚠️</span> Restrições Alimentares
         </h3>
         <p className="text-[10px] text-gray-400 mb-4 font-medium leading-tight">
           A IA evitará estes itens em todas as receitas geradas. Adicione um por um ou separe por vírgula.
         </p>
         
         <div className="flex gap-2 mb-4">
           <label htmlFor="allergy-input" className="sr-only">Digite uma restrição alimentar</label>
           <input 
             id="allergy-input"
             aria-label="Adicionar restrição alimentar"
             maxLength={50}
             value={allergyInput}
             onChange={(e) => setAllergyInput(e.target.value)}
             onKeyDown={handleKeyDown}
             placeholder="Ex: Camarão, Glúten..."
             className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-200 bg-gray-50/50"
           />
           <button 
             onClick={handleAddAllergy} 
             className="bg-red-500 text-white font-bold px-4 rounded-xl hover:bg-red-600 transition-all active:scale-95 shadow-sm"
           >
             +
           </button>
         </div>
         
         <div className="flex flex-wrap gap-2 min-h-[40px]">
           {user?.allergies?.length === 0 && (
             <p className="text-gray-300 text-[11px] italic py-2">Nenhuma restrição cadastrada.</p>
           )}
           {user?.allergies?.map((allergy, i) => (
             <span key={i} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-red-100 animate-fadeIn">
               {allergy} 
               <button 
                 onClick={() => handleRemoveAllergy(i)}
                 className="hover:text-red-800 transition-colors px-1"
                 aria-label={`Remover ${allergy}`}
               >
                 ×
               </button>
             </span>
           ))}
         </div>
       </div>

       <div className="space-y-3">
         {user?.isPremium ? (
           <button 
             onClick={() => {
                if (STRIPE_PORTAL_URL.includes('SEU_LINK_AQUI')) {
                    alert("Link do portal de faturamento não configurado.");
                    return;
                }
                window.location.href = STRIPE_PORTAL_URL;
             }}
             className="w-full bg-white text-gray-700 font-bold py-4 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm"
           >
             💳 Gerenciar Assinatura
           </button>
         ) : (
           <div className="bg-chef-green/5 border border-chef-green/10 p-4 rounded-2xl text-center">
             <p className="text-xs text-chef-green font-bold mb-2">Gostando do Chef.ai?</p>
             <p className="text-[10px] text-gray-500 mb-3">Remova anúncios e libere análise por câmera e macros detalhados.</p>
             <button className="text-chef-green font-black text-xs uppercase tracking-widest underline">Ver Planos Premium</button>
           </div>
         )}
         
         <button onClick={onLogout} className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-all shadow-lg">Sair da Conta</button>
         
         <div className="pt-6 text-center">
           <button onClick={() => {
             if(confirm("Tem certeza? Esta ação apagará permanentemente todos os seus cardápios e dados.")) {
               onDeleteAccount();
             }
           }} className="text-red-400 text-[10px] font-bold uppercase tracking-widest hover:text-red-600 transition-colors">
             Excluir minha conta permanentemente
           </button>
         </div>
       </div>
    </div>
  );
};

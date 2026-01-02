
import React, { useState } from 'react';
import * as SupabaseService from '../services/supabase';

const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

interface ResetPasswordProps {
  onComplete: () => void;
}

export const ResetPassword = ({ onComplete }: ResetPasswordProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await SupabaseService.updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao atualizar senha. O link pode ter expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-8 animate-fadeIn">
      <div className="w-full max-w-sm text-center">
        <div className="mb-12">
          <div className="bg-chef-green w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl shadow-lg shadow-emerald-100 mx-auto mb-6">🔒</div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Nova Senha</h1>
          <p className="text-gray-400 text-sm font-medium mt-2">Escolha uma senha forte para sua conta Chef.ai</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs mb-6 border border-red-100 font-bold animate-shake">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-xs mb-6 border border-emerald-100 font-bold">
            🎉 Senha atualizada! Redirecionando...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Sua nova senha</label>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-chef-green/20 focus:border-chef-green transition-all text-sm font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Confirme a senha</label>
              <input 
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-chef-green/20 focus:border-chef-green transition-all text-sm font-medium"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || success} 
            className="w-full bg-chef-green text-white font-black py-5 rounded-[2rem] shadow-xl shadow-emerald-100 hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 text-xs uppercase tracking-[0.2em] mt-4"
          >
            {loading ? <LoadingSpinner /> : 'Redefinir e Entrar'}
          </button>
        </form>

        <p className="mt-12 text-[9px] text-gray-300 font-bold uppercase tracking-[0.3em]">
          Chef.ai Secure Recovery
        </p>
      </div>
    </main>
  );
};

import React, { useState, useEffect } from 'react';
import * as SupabaseService from '../services/supabase';

const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

export const AuthScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configMissing, setConfigMissing] = useState(false);

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      setConfigMissing(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (configMissing) {
      setError("Erro Crítico: Chaves do Supabase não encontradas no ambiente.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await SupabaseService.signIn(email, password);
      } else {
        await SupabaseService.signUp(email, password);
        try { await SupabaseService.signIn(email, password); } catch (ignore) {}
      }
      onLogin(); 
    } catch (err: any) {
      setError(err.message || "Erro na autenticação");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-white/20">
        <div className="text-center mb-8">
          <div className="bg-gray-900 w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <img 
              src="/favicon.svg" 
              alt="Chef.ai Logo" 
              className="w-12 h-12 object-contain" 
            />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Chef<span className="text-chef-green">.ai</span></h1>
          <div className="mt-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-200">
              Beta Privado
            </span>
          </div>
        </div>

        {configMissing && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-[10px] mb-6 font-mono leading-tight">
            ⚠️ <b>CONFIGURAÇÃO NECESSÁRIA:</b><br/>
            Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente da Vercel.
          </div>
        )}

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs mb-6 border border-red-100 font-medium animate-shake">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email-input" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
            <input 
              id="email-input"
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="seu@email.com"
              className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 outline-none focus:ring-2 focus:ring-chef-green/20 focus:border-chef-green transition-all" 
            />
          </div>
          <div>
            <label htmlFor="password-input" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Senha</label>
            <input 
              id="password-input"
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
              className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 outline-none focus:ring-2 focus:ring-chef-green/20 focus:border-chef-green transition-all" 
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-black transition-all disabled:opacity-50 active:scale-95">
            {loading ? <LoadingSpinner /> : (isLogin ? 'Entrar Agora' : 'Criar minha Conta')}
          </button>
        </form>
        <div className="mt-8 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-xs text-gray-500 hover:text-chef-green font-bold transition-colors">
            {isLogin ? 'Não possui uma conta? Cadastre-se' : 'Já possui conta? Faça o login'}
          </button>
        </div>
      </div>
    </main>
  );
};
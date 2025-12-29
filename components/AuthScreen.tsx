
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
    const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      setConfigMissing(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (configMissing) {
      setError("Configure as chaves VITE_SUPABASE na Vercel.");
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
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm text-center">
        <div className="mb-12">
          <img 
            src="/favicon.svg" 
            alt="Chef.ai Logo" 
            className="w-24 h-24 mx-auto mb-6 drop-shadow-sm" 
          />
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Chef<span className="text-chef-green">.ai</span></h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.3em] mt-3">Inteligência na Cozinha</p>
        </div>

        {configMissing && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-[10px] mb-6 font-mono leading-tight">
            ⚠️ <b>CONFIGURAÇÃO:</b> Adicione as chaves VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel.
          </div>
        )}

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs mb-6 border border-red-100 font-bold">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="Email"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-chef-green/20 focus:border-chef-green transition-all text-sm" 
            />
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Senha"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-chef-green/20 focus:border-chef-green transition-all text-sm" 
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-chef-green text-white font-black py-4 rounded-2xl shadow-xl hover:bg-green-700 transition-all disabled:opacity-50 active:scale-95 text-sm uppercase tracking-widest">
            {loading ? <LoadingSpinner /> : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>
        
        <div className="mt-10">
          <button onClick={() => setIsLogin(!isLogin)} className="text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-chef-green transition-colors">
            {isLogin ? 'Criar uma nova conta' : 'Já tenho uma conta'}
          </button>
        </div>
      </div>
    </main>
  );
};


import React, { useState, useEffect } from 'react';
import * as SupabaseService from '../services/supabase';

const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

interface AuthScreenProps {
  onLogin: () => void;
}

export const AuthScreen = ({ onLogin }: AuthScreenProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [configMissing, setConfigMissing] = useState(false);

  useEffect(() => {
    const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
    if (!supabaseUrl || (supabaseUrl && supabaseUrl.includes('placeholder'))) {
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
    setSuccessMessage(null);

    try {
      if (isForgotPassword) {
        await SupabaseService.sendPasswordResetEmail(email);
        setSuccessMessage("Link enviado! Verifique seu e-mail (e a pasta Spam).");
      } else if (isLogin) {
        await SupabaseService.signIn(email, password);
        onLogin();
      } else {
        await SupabaseService.signUp(email, password);
        setSuccessMessage("Conta criada! Verifique seu e-mail para confirmar.");
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error("Erro Auth:", err);
      let msg = err.message;
      if (msg.includes("Invalid login credentials")) msg = "E-mail ou senha incorretos.";
      if (msg.includes("User already registered")) msg = "Este e-mail já possui uma conta.";
      setError(msg || "Ocorreu um erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  const toggleForgotPassword = () => {
    setError(null);
    setSuccessMessage(null);
    setIsForgotPassword(!isForgotPassword);
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-8 animate-fadeIn">
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
        {successMessage && <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-xs mb-6 border border-emerald-100 font-bold">{successMessage}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 text-left">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 text-center">
              {isForgotPassword ? 'Recuperar Acesso' : (isLogin ? 'Entrar' : 'Criar Conta')}
            </h2>
            
            <input 
              type="email" 
              autoComplete="email"
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="Seu e-mail"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-chef-green/20 focus:border-chef-green transition-all text-sm font-medium" 
            />
            
            {!isForgotPassword && (
              <input 
                type="password" 
                autoComplete="current-password"
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Sua senha"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-chef-green/20 focus:border-chef-green transition-all text-sm font-medium" 
              />
            )}
          </div>

          <button type="submit" disabled={loading} className="w-full bg-chef-green text-white font-black py-5 rounded-[2rem] shadow-xl shadow-emerald-100 hover:brightness-105 transition-all disabled:opacity-50 active:scale-95 text-xs uppercase tracking-[0.2em]">
            {loading ? <LoadingSpinner /> : (isForgotPassword ? 'Enviar Link' : (isLogin ? 'Entrar' : 'Cadastrar'))}
          </button>
        </form>

        {isForgotPassword && (
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-[10px] text-gray-400 font-medium leading-relaxed text-center">
            
          </div>
        )}
        
        <div className="mt-8 space-y-4">
          {!isForgotPassword && isLogin && (
            <button 
              type="button"
              onClick={toggleForgotPassword} 
              className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-chef-orange transition-colors block w-full"
            >
              Esqueci minha senha
            </button>
          )}

          {isForgotPassword ? (
            <button 
              type="button"
              onClick={() => { setIsForgotPassword(false); setIsLogin(true); setError(null); setSuccessMessage(null); }} 
              className="text-[11px] font-black text-chef-green uppercase tracking-widest hover:underline block w-full"
            >
              Voltar para o login
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setSuccessMessage(null); setError(null); }} 
              className="text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-chef-green transition-colors w-full"
            >
              {isLogin ? 'Criar uma nova conta' : 'Já tenho uma conta'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
};


import React, { useState } from 'react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      if (err.message && err.message.includes("Failed to fetch")) {
        setError("Erro de conexão. Verifique o .env.");
      } else {
        setError(err.message || "Erro na autenticação");
      }
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="text-center mb-6">
          <img 
            src="/icon-192.png" 
            alt="Logo" 
            className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-md object-contain bg-gray-900" 
            onError={(e) => {
              e.currentTarget.src = '/favicon.svg';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          />
          <h1 className="text-2xl font-bold text-gray-800">Chef<span className="text-chef-green">.ai</span></h1>
          <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-bold border border-yellow-200">
            VERSÃO BETA
          </span>
        </div>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-200">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email-input" className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
            <input 
              id="email-input"
              type="email" 
              name="email"
              autoComplete="email"
              required 
              maxLength={100}
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-chef-green" 
            />
          </div>
          <div>
            <label htmlFor="password-input" className="block text-xs font-bold text-gray-700 uppercase mb-1">Senha</label>
            <input 
              id="password-input"
              type="password" 
              name="password"
              autoComplete="current-password"
              required 
              maxLength={100}
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-chef-green" 
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-chef-green text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-600 transition-all disabled:opacity-50">
            {loading ? <LoadingSpinner /> : (isLogin ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-gray-500 hover:text-chef-green underline">
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Fazer Login'}
          </button>
        </div>
      </div>
    </main>
  );
};

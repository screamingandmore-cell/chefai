
import React, { useState, useEffect, useRef } from 'react';
import { Layout, AdBanner, GoogleAdPlaceholder } from './components/Layout';
import { 
  ViewState, 
  UserProfile, 
  Recipe, 
  WeeklyMenu, 
  Difficulty 
} from './types';
import * as OpenAIService from './services/openai';
import * as SupabaseService from './services/supabase';
import * as StripeService from './services/stripe';

// Icons using unicode or simple SVG simulation
const LoadingSpinner = () => (
  <svg className="animate-spin h-8 w-8 text-chef-green mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Helper para somar macros
const parseMacro = (val?: string) => {
  if (!val) return 0;
  return parseInt(val.replace(/\D/g, '')) || 0;
};

// Componente de Login Simples
const AuthScreen = ({ onLogin }: { onLogin: () => void }) => {
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
        try {
           await SupabaseService.signIn(email, password);
        } catch (ignore) {}
      }
      onLogin(); 
    } catch (err: any) {
      if (err.message && err.message.includes("Failed to fetch")) {
        setError("Erro de conexão. Verifique se o arquivo .env está configurado corretamente com a URL do Supabase.");
      } else if (err.message && err.message.includes("Invalid login")) {
        setError("Email ou senha incorretos.");
      } else {
        setError(err.message || "Erro na autenticação");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="text-center mb-6">
          <img 
            src="/icon-192.png" 
            alt="Chef.ai Logo" 
            className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-md object-contain bg-gray-900"
            onError={(e) => {
              e.currentTarget.src = '/favicon.svg';
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.onerror = null;
            }}
          />
          <h1 className="text-2xl font-bold text-gray-800">Chef<span className="text-chef-green">.ai</span></h1>
          <p className="text-gray-500 text-sm">Entre para cozinhar melhor</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-200">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-chef-green"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Senha</label>
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-chef-green"
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full bg-chef-green text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-600 transition-all disabled:opacity-50"
          >
            {loading ? <LoadingSpinner /> : (isLogin ? 'Entrar' : 'Criar Conta Grátis')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-gray-500 hover:text-chef-green underline"
          >
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Fazer Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  
  // Estado para Cardápios
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);
  const [allMenus, setAllMenus] = useState<WeeklyMenu[]>([]); // Lista completa do histórico
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    SupabaseService.getUserSession().then(sess => {
      setSession(sess);
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'true' && sess?.user) {
        handlePaymentSuccess(sess.user.id);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    });

    const { data: { subscription } } = SupabaseService.supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setWeeklyMenu(null);
        setAllMenus([]);
        setIngredients([]);
        setGeneratedRecipe(null);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadUserData(session.user.id);
    }
  }, [session]);

  const loadUserData = async (userId: string) => {
    try {
      const profile = await SupabaseService.getUserProfile(userId);
      setUser(profile);
      
      const menus = await SupabaseService.getWeeklyMenus(userId);
      setAllMenus(menus);
      
      if (menus.length > 0) {
        setWeeklyMenu(menus[0]);
      } else {
        setWeeklyMenu(null);
      }
    } catch (e) {
      console.error("Error loading user data", e);
    }
  };

  const handlePaymentSuccess = async (userId: string) => {
    setIsLoading(true);
    try {
      const updatedProfile = { 
        ...await SupabaseService.getUserProfile(userId), 
        isPremium: true 
      };
      await SupabaseService.updateUserProfile(userId, updatedProfile);
      setUser(updatedProfile);
      alert("🎉 Pagamento confirmado! Bem-vindo ao Chef.ai Premium!");
    } catch (e) {
      console.error("Payment sync error", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await SupabaseService.signOut();
    setSession(null);
    setUser(null);
    setWeeklyMenu(null);
    setAllMenus([]);
    setIngredients([]);
    setGeneratedRecipe(null);
    setView(ViewState.HOME);
  };

  const handleAddIngredient = () => {
    if (!currentIngredient.trim()) return;
    const newItems = currentIngredient.split(/[,;]+/).map(s => s.trim()).filter(s => s.length > 0);
    if (newItems.length > 0) {
      setIngredients([...ingredients, ...newItems]);
      setCurrentIngredient('');
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user?.isPremium) {
      alert("A análise por foto é um recurso Premium 👑");
      setView(ViewState.PREMIUM);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const detectedIngredients = await OpenAIService.analyzeFridgeImage(base64);
        setIngredients(prev => [...new Set([...prev, ...detectedIngredients])]); 
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Erro ao analisar imagem com IA. Verifique se sua chave API está correta.");
      setIsLoading(false);
    }
  };

  const generateQuick = async () => {
    if (!user || !session?.user) return;
    
    if (!user.isPremium && user.usage.quickRecipes >= 10) {
      alert("Você atingiu o limite de receitas rápidas do plano Gratuito.");
      setView(ViewState.PREMIUM);
      return;
    }

    let finalIngredients = [...ingredients];
    if (currentIngredient.trim()) {
       finalIngredients.push(currentIngredient.trim());
       setIngredients(prev => [...prev, currentIngredient.trim()]);
       setCurrentIngredient('');
    }

    if (finalIngredients.length === 0) {
      setError("Adicione pelo menos um ingrediente!");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const recipe = await OpenAIService.generateQuickRecipe(
        finalIngredients, 
        user.allergies, 
        selectedDifficulty,
        user.isPremium
      );
      setGeneratedRecipe(recipe);
      const updatedUser = await SupabaseService.incrementUsage(session.user.id, 'quickRecipes');
      setUser(updatedUser);
      setView(ViewState.RECIPE_DETAILS);
    } catch (err: any) {
      setError(err.message || "Erro ao gerar receita.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateWeeklyClick = async () => {
    if (!user || !session?.user) return;

    if (!user.isPremium && user.usage.weeklyMenus >= 1) {
      alert("Você já criou seu cardápio semanal gratuito.");
      setView(ViewState.PREMIUM);
      return;
    }

    let finalIngredients = [...ingredients];
    if (currentIngredient.trim()) {
       finalIngredients.push(currentIngredient.trim());
       setIngredients(prev => [...prev, currentIngredient.trim()]);
       setCurrentIngredient('');
    }

    const totalLength = finalIngredients.join(' ').length;
    const isLongText = totalLength > 15;

    if (finalIngredients.length < 2 && !isLongText) {
      setError("Adicione mais ingredientes ou uma lista maior para criar um cardápio.");
      return;
    }

    setView(ViewState.WEEKLY_PLAN);
    setIsLoading(true);
    setError(null);
    
    try {
      const menu = await OpenAIService.generateWeeklyMenu(
        finalIngredients, 
        user.allergies, 
        user.isPremium
      );
      setWeeklyMenu(menu);
      await SupabaseService.saveWeeklyMenu(session.user.id, menu);
      
      // Atualiza lista local
      const newHistory = [menu, ...allMenus];
      setAllMenus(newHistory);
      
      const updatedUser = await SupabaseService.incrementUsage(session.user.id, 'weeklyMenus');
      setUser(updatedUser);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao gerar cardápio.");
      setView(ViewState.FRIDGE);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!session?.user) return;
    setIsLoading(true);
    setError(null);
    try {
      const success = await StripeService.initiateCheckout(planId, session.user.email);
      if (!success) setIsLoading(false);
    } catch (e) {
      setError("Ocorreu um erro na comunicação com o pagamento.");
      setIsLoading(false);
    }
  };

  const updateAllergies = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session?.user) return;
    const formData = new FormData(e.currentTarget);
    const allergyText = formData.get('allergies') as string;
    const allergyList = allergyText.split(',').map(s => s.trim()).filter(Boolean);
    if (user) {
      const updated = { ...user, allergies: allergyList };
      await SupabaseService.updateUserProfile(session.user.id, updated);
      setUser(updated);
      alert("Alergias atualizadas com sucesso!");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareList = () => {
    if (!weeklyMenu) return;
    
    const title = "🛒 Lista de Compras - Chef.ai";
    const items = weeklyMenu.shoppingList.map(item => `- ${item}`).join('\n');
    const text = `${title}\n\n${items}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Funções de Gerenciamento de Histórico
  const handleDeleteSingle = async (menuId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir o cardápio ao clicar na lixeira
    if (!confirm("Deseja realmente apagar este cardápio?")) return;
    
    try {
      await SupabaseService.deleteWeeklyMenu(menuId);
      const newList = allMenus.filter(m => m.id !== menuId);
      setAllMenus(newList);
      
      // Se apagou o que estava sendo visto, carrega o primeiro da nova lista ou null
      if (weeklyMenu?.id === menuId) {
        setWeeklyMenu(newList.length > 0 ? newList[0] : null);
      }
    } catch (err) {
      alert("Erro ao excluir. Verifique se rodou o script SQL no Supabase.");
    }
  };

  const handleClearHistory = async () => {
    if (!session?.user) return;
    if (!confirm("ATENÇÃO: Isso apagará TODOS os seus cardápios salvos permanentemente. Continuar?")) return;

    try {
      await SupabaseService.deleteAllUserMenus(session.user.id);
      setAllMenus([]);
      setWeeklyMenu(null);
      alert("Histórico limpo com sucesso.");
    } catch (err) {
      alert("Erro ao limpar histórico.");
    }
  };

  const renderHome = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-chef-green to-teal-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">O que vamos cozinhar hoje?</h2>
          <p className="opacity-90 text-sm mb-4">Evite desperdícios e economize tempo.</p>
          <button onClick={() => setView(ViewState.FRIDGE)} className="bg-white text-chef-green font-bold py-2 px-6 rounded-full shadow-sm hover:shadow-md transition-shadow">
            Abrir Geladeira
          </button>
        </div>
        <div className="absolute right-[-20px] bottom-[-20px] text-8xl opacity-20">🥗</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div onClick={() => setView(ViewState.QUICK_RECIPE)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
          <span className="text-3xl bg-orange-100 w-12 h-12 flex items-center justify-center rounded-full">🍳</span>
          <span className="font-semibold text-gray-700">Receita Rápida</span>
        </div>
        <div onClick={() => setView(ViewState.WEEKLY_PLAN)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform">
          <span className="text-3xl bg-blue-100 w-12 h-12 flex items-center justify-center rounded-full">📅</span>
          <span className="font-semibold text-gray-700">Cardápio Semanal</span>
        </div>
      </div>
      {!user?.isPremium && <GoogleAdPlaceholder label="Anúncio Google - Feed Principal" />}
      {!user?.isPremium && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-bold text-yellow-800 flex items-center gap-2"><span>👑</span> Premium</h3>
          <p className="text-sm text-yellow-700 mt-1 mb-3">Receitas ilimitadas, análise por foto, tabela nutricional e zero anúncios.</p>
          <button onClick={() => setView(ViewState.PREMIUM)} className="w-full bg-yellow-400 text-yellow-900 font-bold py-2 rounded-lg">Conhecer Planos</button>
        </div>
      )}
      {weeklyMenu && (
        <div className="mt-6">
          <h3 className="font-bold text-gray-800 mb-2">Seu Cardápio Atual</h3>
          <div onClick={() => setView(ViewState.WEEKLY_PLAN)} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer">
             <p className="text-sm text-gray-500">Criado em: {new Date(weeklyMenu.createdAt).toLocaleDateString()}</p>
             <p className="font-medium text-chef-green mt-1">Ver planejamento completo →</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderFridge = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Minha Geladeira ❄️</h2>
      <div className="flex gap-2">
        <input type="text" value={currentIngredient} onChange={(e) => setCurrentIngredient(e.target.value)} placeholder="Ex: Frango, Batata... (pode colar lista)" className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-chef-green outline-none" onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()} />
        <button onClick={handleAddIngredient} className="bg-chef-green text-white px-4 py-2 rounded-lg font-bold">+</button>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Ou use a câmera (Premium)</p>
        <button onClick={() => fileInputRef.current?.click()} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border ${user?.isPremium ? 'border-chef-green text-chef-green bg-green-50' : 'border-gray-300 text-gray-400 bg-gray-50'}`}>
          <span>📸</span>{user?.isPremium ? 'Analisar Foto' : 'Foto (Bloqueado)'}
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
      </div>
      {isLoading && (<div className="text-center py-4"><LoadingSpinner /><p className="text-sm text-gray-500 mt-2">Analisando imagem com IA...</p></div>)}
      <div className="flex flex-wrap gap-2">
        {ingredients.map((ing, idx) => (
          <span key={idx} className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
            {ing}
            <button onClick={() => handleRemoveIngredient(idx)} className="text-red-400 hover:text-red-600 font-bold">×</button>
          </span>
        ))}
        {ingredients.length === 0 && (<p className="text-gray-400 italic text-sm w-full text-center py-8">Sua geladeira está vazia no app. Adicione itens!</p>)}
      </div>
      <div className="fixed bottom-20 left-0 right-0 p-4 max-w-md mx-auto z-10">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => { setView(ViewState.QUICK_RECIPE); }} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg transition-colors" disabled={ingredients.length === 0 && !currentIngredient}>Receita Rápida</button>
          <button onClick={handleGenerateWeeklyClick} className="bg-chef-green hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg transition-colors" disabled={ingredients.length === 0 && !currentIngredient}>Gerar Semanal</button>
        </div>
      </div>
    </div>
  );

  const renderQuickRecipeSetup = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Configurar Receita</h2>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-semibold mb-3">Dificuldade</h3>
        <div className="flex gap-2">
          {Object.values(Difficulty).map((diff) => (
            <button key={diff} onClick={() => setSelectedDifficulty(diff)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDifficulty === diff ? 'bg-chef-green text-white shadow-sm' : 'bg-gray-100 text-gray-600'}`}>
              {diff}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-semibold mb-3">Ingredientes Selecionados</h3>
        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
          {ingredients.length > 0 ? ingredients.join(', ') : 'Nenhum ingrediente selecionado'}
        </div>
        <button onClick={() => setView(ViewState.FRIDGE)} className="text-chef-green text-sm font-medium mt-2">Editar ingredientes</button>
      </div>
      <button onClick={generateQuick} disabled={isLoading || ingredients.length === 0} className="w-full bg-gradient-to-r from-chef-green to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50">
        {isLoading ? <LoadingSpinner /> : 'Criar Receita Mágica ✨'}
      </button>
      {!user?.isPremium && <p className="text-xs text-center text-gray-400">Você tem {10 - (user?.usage.quickRecipes || 0)} receitas gratuitas restantes.</p>}
    </div>
  );

  const renderRecipeDetails = () => {
    if (!generatedRecipe) return null;
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center no-print">
          <button onClick={() => setView(ViewState.HOME)} className="text-sm text-gray-500">← Voltar</button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200"><span>🖨️</span> Baixar PDF</button>
        </div>
        <div className="print-header">
           <h1 className="text-xl font-bold text-gray-800">Chef.ai - Receita Inteligente</h1>
        </div>
        <div className="relative h-48 bg-gray-200 rounded-2xl overflow-hidden mb-4 no-print">
           <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-yellow-100 text-4xl">🍲</div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{generatedRecipe.title}</h2>
          <div className="flex gap-4 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">⏱️ {generatedRecipe.prepTime}</span>
            <span className="flex items-center gap-1">📊 {generatedRecipe.difficulty}</span>
          </div>
        </div>
        {user?.isPremium && generatedRecipe.calories ? (
           <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
             <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-1">📊 Tabela Nutricional <span className="text-[10px] bg-yellow-400 text-yellow-900 px-1 rounded no-print">PREMIUM</span></h4>
             <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div className="bg-white p-2 rounded-lg shadow-sm"><p className="text-xs text-gray-500 font-bold">CALORIAS</p><p className="text-emerald-600 font-bold">{generatedRecipe.calories}</p></div>
                <div className="bg-white p-2 rounded-lg shadow-sm"><p className="text-xs text-gray-500 font-bold">PROT</p><p className="text-gray-800">{generatedRecipe.macros?.protein}</p></div>
                <div className="bg-white p-2 rounded-lg shadow-sm"><p className="text-xs text-gray-500 font-bold">CARB</p><p className="text-gray-800">{generatedRecipe.macros?.carbs}</p></div>
                <div className="bg-white p-2 rounded-lg shadow-sm"><p className="text-xs text-gray-500 font-bold">GORD</p><p className="text-gray-800">{generatedRecipe.macros?.fat}</p></div>
             </div>
           </div>
        ) : user?.isPremium ? <div className="text-xs text-gray-400 text-center">Dados nutricionais indisponíveis para esta receita.</div> : null}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold mb-3 text-lg">Ingredientes</h3>
          <ul className="space-y-2">
            {generatedRecipe.ingredients.map((ing, i) => (<li key={i} className="flex items-start gap-2 text-gray-700"><span className="text-chef-green">•</span> {ing}</li>))}
          </ul>
        </div>
        {!user?.isPremium && <div className="no-print"><GoogleAdPlaceholder label="Anúncio Google" /></div>}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold mb-3 text-lg">Modo de Preparo</h3>
          <ol className="space-y-4">
            {generatedRecipe.instructions.map((step, i) => (<li key={i} className="flex gap-3 text-gray-700"><span className="bg-gray-100 text-gray-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span><span className="leading-relaxed">{step}</span></li>))}
          </ol>
        </div>
        {!user?.isPremium && <div className="no-print"><AdBanner type="interstitial" /></div>}
      </div>
    );
  };

  const renderWeeklyPlan = () => {
    if (isLoading) return (<div className="h-full flex flex-col items-center justify-center pt-20"><LoadingSpinner /><h3 className="text-xl font-bold mt-4 text-gray-800">Planejando sua semana...</h3><p className="text-gray-500 text-center px-8 mt-2">A IA está combinando ingredientes.</p></div>);
    if (!weeklyMenu) return (<div className="text-center py-10"><div className="text-6xl mb-4">📅</div><h2 className="text-xl font-bold text-gray-800">Nenhum cardápio ativo</h2><p className="text-gray-500 mb-6 px-4">Adicione ingredientes na geladeira e gere seu plano semanal.</p><button onClick={() => setView(ViewState.FRIDGE)} className="bg-chef-green text-white px-6 py-2 rounded-full font-bold">Criar Cardápio</button><div className="mt-8"><button onClick={() => setView(ViewState.MENU_HISTORY)} className="text-sm text-gray-500 underline">Ver Histórico de Cardápios</button></div></div>);

    return (
      <div className="space-y-6">
        <div className="print-header">
           <h1 className="text-xl font-bold text-gray-800">Chef.ai - Cardápio Semanal</h1>
           <p className="text-sm">Semana de {new Date(weeklyMenu.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="flex flex-col gap-2 no-print">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Cardápio Semanal</h2>
            <div className="flex gap-2">
              <button onClick={() => setView(ViewState.MENU_HISTORY)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors" title="Ver Histórico">📜 Histórico</button>
              <button onClick={handlePrint} className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full transition-colors" title="Baixar PDF / Imprimir">🖨️</button>
            </div>
          </div>
        </div>
        
        <div className="no-print flex justify-end">
           <button onClick={() => setView(ViewState.SHOPPING_LIST)} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">Ver Lista de Compras</button>
        </div>

        {!user?.isPremium && <div className="no-print"><GoogleAdPlaceholder label="Anúncio Google" /></div>}

        <div className="space-y-4 no-print">
          {weeklyMenu.days.map((day, idx) => {
             const totalCals = (day.lunch.calories || 0) + (day.dinner.calories || 0);
             const totalProt = parseMacro(day.lunch.macros?.protein) + parseMacro(day.dinner.macros?.protein);
             const totalCarb = parseMacro(day.lunch.macros?.carbs) + parseMacro(day.dinner.macros?.carbs);
             const totalFat = parseMacro(day.lunch.macros?.fat) + parseMacro(day.dinner.macros?.fat);

             return (
               <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden break-inside-avoid">
                 <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                   <span className="font-bold text-gray-700">{day.day}</span>
                   {user?.isPremium && totalCals > 0 && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{totalCals} kcal</span>}
                 </div>
                 <div className="p-4 space-y-4">
                   <div className="flex gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors" onClick={() => { setGeneratedRecipe(day.lunch); setView(ViewState.RECIPE_DETAILS); }}>
                     <span className="text-2xl">☀️</span>
                     <div className="flex-1">
                       <p className="text-xs text-gray-400 font-bold uppercase">Almoço</p>
                       <p className="text-gray-800 font-medium leading-tight">{day.lunch.title}</p>
                     </div>
                   </div>
                   <div className="h-px bg-gray-100" />
                   <div className="flex gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors" onClick={() => { setGeneratedRecipe(day.dinner); setView(ViewState.RECIPE_DETAILS); }}>
                     <span className="text-2xl">🌙</span>
                     <div className="flex-1">
                       <p className="text-xs text-gray-400 font-bold uppercase">Jantar</p>
                       <p className="text-gray-800 font-medium leading-tight">{day.dinner.title}</p>
                     </div>
                   </div>
                 </div>
                 {user?.isPremium && totalCals > 0 && (
                   <div className="bg-emerald-50 px-4 py-2 text-xs flex justify-around text-emerald-800 font-medium border-t border-emerald-100">
                     <span>P: {totalProt}g</span><span>C: {totalCarb}g</span><span>G: {totalFat}g</span>
                   </div>
                 )}
               </div>
             );
          })}
        </div>

        {/* --- CONTEÚDO OCULTO QUE APARECE SÓ NO PDF --- */}
        <div className="print-only">
          {weeklyMenu.days.map((day, idx) => (
            <div key={idx} className="page-break mb-8">
              <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-200 pb-2 mt-8 uppercase">{day.day}</h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">☀️ Almoço: {day.lunch.title}</h3>
                <div className="bg-gray-50 p-4 rounded mb-4">
                  <p><strong>Ingredientes:</strong></p>
                  <ul className="list-disc pl-5 mb-2">
                    {day.lunch.ingredients.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                  <p><strong>Modo de Preparo:</strong></p>
                  <ol className="list-decimal pl-5">
                    {day.lunch.instructions.map((step, i) => <li key={i}>{step}</li>)}
                  </ol>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">🌙 Jantar: {day.dinner.title}</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p><strong>Ingredientes:</strong></p>
                  <ul className="list-disc pl-5 mb-2">
                    {day.dinner.ingredients.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                  <p><strong>Modo de Preparo:</strong></p>
                  <ol className="list-decimal pl-5">
                    {day.dinner.instructions.map((step, i) => <li key={i}>{step}</li>)}
                  </ol>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMenuHistory = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button onClick={() => setView(ViewState.WEEKLY_PLAN)} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full">←</button>
        <h2 className="text-2xl font-bold text-gray-800">Histórico de Cardápios</h2>
      </div>

      {allMenus.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p>Nenhum cardápio salvo.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allMenus.map((menu) => (
            <div key={menu.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-700">Semana de {new Date(menu.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-gray-400">{menu.days.length} dias planejados</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setWeeklyMenu(menu); setView(ViewState.WEEKLY_PLAN); }}
                  className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100"
                  title="Ver Cardápio"
                >
                  👁️
                </button>
                <button 
                  onClick={(e) => handleDeleteSingle(menu.id, e)}
                  className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100"
                  title="Excluir"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {allMenus.length > 0 && (
        <button 
          onClick={handleClearHistory}
          className="w-full mt-8 border border-red-200 text-red-500 py-3 rounded-xl hover:bg-red-50 text-sm font-bold"
        >
          Limpar Todo o Histórico
        </button>
      )}
    </div>
  );

  const renderShoppingList = () => {
    if (!weeklyMenu) return null;
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center no-print">
           <button onClick={() => setView(ViewState.WEEKLY_PLAN)} className="text-sm text-gray-500">← Voltar</button>
           <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200"><span>🖨️</span> PDF</button>
        </div>
        <div className="print-header">
           <h1 className="text-xl font-bold text-gray-800">Chef.ai - Lista de Compras</h1>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Lista de Compras 🛒</h2>
        <p className="text-sm text-gray-500 no-print">Baseada no que você NÃO tem na geladeira.</p>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          {weeklyMenu.shoppingList.map((item, i) => (
            <div key={i} className="p-4 flex items-center gap-3">
              <input type="checkbox" className="w-5 h-5 text-chef-green rounded focus:ring-chef-green no-print" />
              <span className="text-gray-700">{item}</span>
            </div>
          ))}
        </div>
        <button 
          onClick={handleShareList}
          className="w-full text-center text-chef-green font-bold py-4 no-print hover:bg-green-50 rounded-xl transition-colors"
        >
          Compartilhar Lista (WhatsApp)
        </button>
      </div>
    );
  };

  const renderPremium = () => (
    <div className="space-y-6 pb-10">
      <div className="text-center space-y-2"><span className="text-5xl">👑</span><h2 className="text-3xl font-bold text-gray-900">Seja Chef.ai Premium</h2><p className="text-gray-500">Desbloqueie todo o potencial da sua cozinha.</p></div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <ul className="space-y-3">
          <li className="flex items-center gap-3"><span className="text-green-500 text-xl">✓</span><span>Cardápios semanais <strong>Ilimitados</strong></span></li>
          <li className="flex items-center gap-3"><span className="text-green-500 text-xl">✓</span><span>Análise de geladeira por <strong>Foto</strong></span></li>
          <li className="flex items-center gap-3"><span className="text-green-500 text-xl">✓</span><span>Sem anúncios</span></li>
          <li className="flex items-center gap-3"><span className="text-green-500 text-xl">✓</span><span>Tabela Nutricional (Calorias/Macros)</span></li>
        </ul>
      </div>
      <div className="space-y-4">
        {StripeService.PLANS.map((plan) => (
          <button key={plan.id} onClick={() => handleSubscribe(plan.id)} disabled={isLoading || user?.isPremium} className={`w-full relative p-4 rounded-xl border-2 transition-all ${plan.id === 'annual' ? 'border-chef-green bg-green-50' : 'border-gray-200 bg-white'}`}>
            {plan.savings && (<span className="absolute -top-3 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">ECO {plan.savings}</span>)}
            <div className="flex justify-between items-center"><div className="text-left"><p className="font-bold text-lg text-gray-800">{plan.name}</p><p className="text-sm text-gray-500">Cobrado por {plan.interval}</p></div><div className="text-right"><p className="font-bold text-xl text-chef-green">R$ {plan.price.toFixed(2).replace('.', ',')}</p><p className="text-xs text-gray-400">/{plan.interval}</p></div></div>
          </button>
        ))}
      </div>
      {user?.isPremium && (<div className="bg-green-100 p-4 rounded-lg text-green-800 text-center font-bold">Você já é assinante Premium!</div>)}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Perfil</h2><button onClick={handleLogout} className="text-sm text-red-500 font-bold border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50">Sair</button></div>
      <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-600">Logado como: <strong>{session?.user?.email}</strong></div>
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-bold mb-4 text-red-500 flex items-center gap-2">🚫 Restrições Alimentares</h3><p className="text-sm text-gray-500 mb-4">A IA nunca sugerirá ingredientes listados aqui.</p>
        <form onSubmit={updateAllergies} className="space-y-3">
          <textarea name="allergies" defaultValue={user?.allergies.join(', ')} placeholder="Ex: Amendoim, Camarão, Glúten..." className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-200 outline-none" rows={3} />
          <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold w-full">Salvar Alergias</button>
        </form>
      </div>
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-bold mb-2">Estatísticas</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-gray-50 p-3 rounded-lg"><p className="text-2xl font-bold text-chef-green">{user?.usage.quickRecipes}</p><p className="text-xs text-gray-500">Receitas Geradas</p></div>
          <div className="bg-gray-50 p-3 rounded-lg"><p className="text-2xl font-bold text-blue-500">{user?.usage.weeklyMenus}</p><p className="text-xs text-gray-500">Cardápios Criados</p></div>
        </div>
      </div>
    </div>
  );

  const renderPrivacyPolicy = () => (
    <div className="bg-white min-h-screen space-y-6 pb-8">
      <div className="flex items-center gap-2 mb-6"><button onClick={() => setView(ViewState.HOME)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-bold text-gray-700">← Voltar ao Início</button></div>
      <h2 className="text-3xl font-bold text-gray-900">Política de Privacidade</h2>
      <p className="text-sm text-gray-500">Última atualização: Dezembro de 2024</p>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-sm text-gray-700 leading-relaxed space-y-4">
        <section><h3 className="font-bold text-gray-900 text-lg mb-2">1. Coleta de Informações</h3><p>Coletamos o endereço de e-mail fornecido no cadastro para autenticação. Informações sobre ingredientes e preferências alimentares são processadas apenas para gerar receitas personalizadas e não são vendidas a terceiros.</p></section>
        <section><h3 className="font-bold text-gray-900 text-lg mb-2">2. Uso de Imagens</h3><p>O recurso de "Análise de Geladeira" envia sua foto temporariamente para nossos servidores de Inteligência Artificial para identificar ingredientes. A imagem é descartada logo após a análise e não é armazenada em nossos bancos de dados.</p></section>
        <section><h3 className="font-bold text-gray-900 text-lg mb-2">3. Pagamentos</h3><p>Todas as transações financeiras são processadas pelo Stripe. Não temos acesso nem armazenamos os dados do seu cartão de crédito em nossos servidores.</p></section>
        <section><h3 className="font-bold text-gray-900 text-lg mb-2">4. Publicidade</h3><p>Para usuários do plano gratuito, utilizamos serviços de publicidade como o Google AdSense, que podem coletar cookies anônimos para exibir anúncios relevantes.</p></section>
        <section><h3 className="font-bold text-gray-900 text-lg mb-2">5. Contato e Exclusão</h3><p>Para solicitar a exclusão de sua conta e todos os dados associados, entre em contato através do e-mail de suporte disponível na loja de aplicativos.</p></section>
      </div>
    </div>
  );

  const renderTermsOfUse = () => (
    <div className="bg-white min-h-screen space-y-6 pb-8">
      <div className="flex items-center gap-2 mb-6"><button onClick={() => setView(ViewState.HOME)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-bold text-gray-700">← Voltar ao Início</button></div>
      <h2 className="text-3xl font-bold text-gray-900">Termos de Uso</h2>
      <p className="text-sm text-gray-500">Última atualização: Dezembro de 2024</p>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-sm text-gray-700 leading-relaxed space-y-4">
        <section><h3 className="font-bold text-gray-900 text-lg mb-2">1. Aceitação</h3><p>Ao criar uma conta no Chef.ai, você concorda integralmente com estes termos. O serviço é destinado a auxiliar no planejamento alimentar doméstico.</p></section>
        <section><h3 className="font-bold text-gray-900 text-lg mb-2">2. Isenção de Responsabilidade (Saúde)</h3><p>As receitas e informações nutricionais são geradas por Inteligência Artificial. Embora nos esforcemos pela precisão, <strong>não substitui a orientação de um nutricionista ou médico</strong>. Verifique sempre os ingredientes caso possua alergias graves.</p></section>
        <section><h3 className="font-bold text-gray-900 text-lg mb-2">3. Planos e Assinaturas</h3><p>O plano "Premium" oferece recursos extras mediante pagamento recorrente. Você pode cancelar a renovação a qualquer momento. Não realizamos reembolsos parciais de períodos já iniciados.</p></section>
        <section><h3 className="font-bold text-gray-900 text-lg mb-2">4. Conduta do Usuário</h3><p>É proibido utilizar o aplicativo para fins ilícitos, tentar engenharia reversa ou sobrecarregar nossos servidores.</p></section>
        <section><h3 className="font-bold text-gray-900 text-lg mb-2">5. Alterações</h3><p>Reservamo-nos o direito de modificar estes termos a qualquer momento. O uso contínuo do aplicativo após alterações constitui aceitação dos novos termos.</p></section>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (view) {
      case ViewState.HOME: return renderHome();
      case ViewState.FRIDGE: return renderFridge();
      case ViewState.QUICK_RECIPE: return renderQuickRecipeSetup();
      case ViewState.RECIPE_DETAILS: return renderRecipeDetails();
      case ViewState.WEEKLY_PLAN: return renderWeeklyPlan();
      case ViewState.MENU_HISTORY: return renderMenuHistory();
      case ViewState.SHOPPING_LIST: return renderShoppingList();
      case ViewState.PREMIUM: return renderPremium();
      case ViewState.PROFILE: return renderProfile();
      case ViewState.PRIVACY: return renderPrivacyPolicy();
      case ViewState.TERMS: return renderTermsOfUse();
      default: return renderHome();
    }
  };

  if (!session) return <AuthScreen onLogin={() => {}} />;

  return (
    <Layout activeView={view} onNavigate={setView} isPremium={user?.isPremium || false}>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </span>
        </div>
      )}
      <div key={view} className="animate-fade-in printable">{renderCurrentView()}</div>
    </Layout>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Layout, GoogleAdPlaceholder, AdBanner, AdInterstitial } from './components/Layout';
import { ViewState, UserProfile, Recipe, WeeklyMenu, Difficulty } from './types';
import * as OpenAIService from './services/openai';
import * as SupabaseService from './services/supabase';
import * as StripeService from './services/stripe';

// Link do Portal do Cliente Stripe
const STRIPE_PORTAL_URL = process.env.VITE_STRIPE_PORTAL_URL || 'https://billing.stripe.com/p/login/SEU_LINK_AQUI';

const LoadingSpinner = () => (
  <svg className="animate-spin h-8 w-8 text-chef-green mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

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

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);
  const [allMenus, setAllMenus] = useState<WeeklyMenu[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [allergyInput, setAllergyInput] = useState('');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [pendingAction, setPendingAction] = useState<'quick' | 'weekly' | null>(null);

  useEffect(() => {
    SupabaseService.getUserSession().then(sess => {
      setSession(sess);
      
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      
      if (params.get('success') === 'true' && sess?.user) {
        handlePaymentSuccess(sess.user.id);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (action === 'fridge') {
        setView(ViewState.FRIDGE);
      } else if (action === 'weekly') {
        setView(ViewState.WEEKLY_PLAN);
      }
    });

    const { data: { subscription } } = SupabaseService.supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setWeeklyMenu(null); setAllMenus([]); setIngredients([]); setGeneratedRecipe(null); setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session?.user) loadUserData(session.user.id); }, [session]);

  const loadUserData = async (userId: string) => {
    try {
      const profile = await SupabaseService.getUserProfile(userId);
      setUser(profile);
      const menus = await SupabaseService.getWeeklyMenus(userId);
      setAllMenus(menus);
      if (menus.length > 0) setWeeklyMenu(menus[0]);
    } catch (e) { console.error("Error loading user data", e); }
  };

  const handlePaymentSuccess = async (userId: string) => {
    setIsLoading(true);
    try {
      const updatedProfile = { ...await SupabaseService.getUserProfile(userId), isPremium: true };
      await SupabaseService.updateUserProfile(userId, updatedProfile);
      setUser(updatedProfile);
      alert("🎉 Pagamento confirmado!");
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleLogout = async () => {
    await SupabaseService.signOut();
    setSession(null); setUser(null); setWeeklyMenu(null); setAllMenus([]); setIngredients([]); setGeneratedRecipe(null);
    setView(ViewState.HOME);
  };

  const handleDeleteAccount = async () => {
    const confirm1 = confirm("⚠️ ATENÇÃO: Tem certeza que deseja excluir sua conta?\n\nEsta ação apagará seu login, senha, cardápios e histórico para sempre. Não é possível desfazer.");
    if (!confirm1) return;
    
    const confirm2 = confirm("Último aviso: Se você tiver uma assinatura Premium ativa, cancele-a no portal antes de excluir a conta para evitar cobranças futuras.\n\nDeseja prosseguir com a exclusão?");
    if (!confirm2) return;

    setIsLoading(true);
    try {
      await SupabaseService.deleteAccount();
      alert("Sua conta foi excluída com sucesso. Sentiremos sua falta!");
    } catch (e: any) {
      alert("Erro ao excluir conta: " + e.message);
      if (e.message.includes("SQL")) {
         const subject = "Solicitação de Exclusão de Conta - Chef.ai";
         const body = `Olá, gostaria de solicitar a exclusão manual da minha conta: ${session?.user?.email}`;
         window.location.href = `mailto:suporte@chefai.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const processIngredientInput = (input: string) => input.split(/[,;\n]+/).map(s => s.trim()).filter(s => s.length > 0);

  const handleAddIngredient = () => {
    if (!currentIngredient.trim()) return;
    const newItems = processIngredientInput(currentIngredient);
    if (newItems.length > 0) {
      setIngredients(prev => [...prev, ...newItems]);
      setCurrentIngredient('');
    }
  };

  const handleRemoveIngredient = (index: number) => setIngredients(ingredients.filter((_, i) => i !== index));

  const handleAddAllergy = async () => {
    if (!allergyInput.trim() || !user || !session?.user) return;
    const newAllergy = allergyInput.trim();
    const updatedAllergies = [...(user.allergies || []), newAllergy];
    const updatedUser = { ...user, allergies: updatedAllergies };
    
    setUser(updatedUser); 
    setAllergyInput('');
    await SupabaseService.updateUserProfile(session.user.id, updatedUser); 
  };

  const handleRemoveAllergy = async (index: number) => {
    if (!user || !session?.user) return;
    const updatedAllergies = user.allergies.filter((_, i) => i !== index);
    const updatedUser = { ...user, allergies: updatedAllergies };
    
    setUser(updatedUser);
    await SupabaseService.updateUserProfile(session.user.id, updatedUser);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!user?.isPremium) { alert("Recurso Premium 👑"); setView(ViewState.PREMIUM); return; }
    setIsLoading(true); setError(null);
    try {
      const imagesBase64: string[] = [];
      for (let i = 0; i < Math.min(files.length, 6); i++) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(files[i]);
        });
        imagesBase64.push(base64);
      }
      const detected = await OpenAIService.analyzeFridgeImage(imagesBase64);
      setIngredients(prev => [...new Set([...prev, ...detected])]);
    } catch (err) { console.error(err); setError("Erro ao analisar imagens."); } finally { setIsLoading(false); }
  };

  const checkLimits = (type: 'quick' | 'weekly'): boolean => {
    if (!user || user.isPremium) return true; 
    
    // Limite de 10 Receitas Rápidas
    if (type === 'quick' && user.usage.quickRecipes >= 10) return false;
    
    // ATUALIZAÇÃO: Limite de 3 Cardápios Semanais para usuários gratuitos
    if (type === 'weekly' && user.usage.weeklyMenus >= 3) return false;
    
    return true;
  };

  const triggerAdReward = (type: 'quick' | 'weekly') => {
    setPendingAction(type);
    setShowLimitModal(true);
  };

  const handleAdFinish = () => {
    setIsWatchingAd(false);
    setShowLimitModal(false);
    if (pendingAction === 'quick') generateQuick(true);
    if (pendingAction === 'weekly') handleGenerateWeeklyClick(true);
    setPendingAction(null);
  };

  const generateQuick = async (bypassLimit = false) => {
    if (!user || !session?.user) return;
    
    if (!bypassLimit && !checkLimits('quick')) { triggerAdReward('quick'); return; }

    let finalIngredients = [...ingredients];
    if (currentIngredient.trim()) {
       const extra = processIngredientInput(currentIngredient);
       finalIngredients = [...finalIngredients, ...extra];
    }
    if (finalIngredients.length === 0) { setError("Adicione ingredientes!"); return; }
    setIsLoading(true); setError(null);
    try {
      const recipe = await OpenAIService.generateQuickRecipe(finalIngredients, user.allergies, selectedDifficulty, user.isPremium);
      setGeneratedRecipe(recipe);
      const updatedUser = await SupabaseService.incrementUsage(session.user.id, 'quickRecipes');
      setUser(updatedUser);
      setView(ViewState.RECIPE_DETAILS);
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  };

  const handleGenerateWeeklyClick = async (bypassLimit = false) => {
    if (!user || !session?.user) return;

    if (!bypassLimit && !checkLimits('weekly')) { triggerAdReward('weekly'); return; }

    let finalIngredients = [...ingredients];
    if (currentIngredient.trim()) {
       const extra = processIngredientInput(currentIngredient);
       finalIngredients = [...finalIngredients, ...extra];
    }
    const isLongText = finalIngredients.length === 1 && finalIngredients[0].includes(' ');
    if (finalIngredients.length < 2 && !isLongText) { setError("Adicione pelo menos 2 ingredientes."); return; }
    setIsLoading(true); setError(null);
    try {
      const menu = await OpenAIService.generateWeeklyMenu(finalIngredients, user.allergies, user.isPremium);
      await SupabaseService.saveWeeklyMenu(session.user.id, menu);
      setWeeklyMenu(menu);
      setAllMenus(prev => [menu, ...prev]);
      const updatedUser = await SupabaseService.incrementUsage(session.user.id, 'weeklyMenus');
      setUser(updatedUser);
      setView(ViewState.WEEKLY_PLAN);
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  };

  const handleShareList = () => {
    if (!weeklyMenu) return;
    const text = `🛒 *Lista de Compras - Chef.ai*\n\n${weeklyMenu.shoppingList.map(i => `- ${i}`).join('\n')}`;
    if (navigator.share) { navigator.share({ title: 'Lista de Compras', text: text }).catch(console.error); }
    else { window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank'); }
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!confirm("Apagar este cardápio?")) return;
    try {
      await SupabaseService.deleteWeeklyMenu(menuId);
      const newHistory = allMenus.filter(m => m.id !== menuId);
      setAllMenus(newHistory);
      if (weeklyMenu?.id === menuId) setWeeklyMenu(newHistory.length > 0 ? newHistory[0] : null);
    } catch (e: any) { alert("Erro ao excluir: " + e.message); }
  };

  const handleDeleteAllMenus = async () => {
    if (!session?.user || !confirm("Apagar TODO o histórico?")) return;
    try {
      await SupabaseService.deleteAllUserMenus(session.user.id);
      setAllMenus([]); setWeeklyMenu(null);
      alert("Histórico limpo.");
    } catch (e: any) { alert("Erro: " + e.message); }
  };

  if (!session) return <AuthScreen onLogin={() => {}} />;

  const renderHome = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-chef-green to-teal-500 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">O que vamos cozinhar?</h2>
        <button onClick={() => setView(ViewState.FRIDGE)} className="bg-white text-chef-green px-6 py-3 rounded-xl font-bold shadow-md w-full sm:w-auto mt-4">Abrir Geladeira</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setView(ViewState.QUICK_RECIPE)} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3">
          <span className="text-3xl bg-orange-50 p-3 rounded-full">🍳</span><span className="font-bold text-gray-700">Receita Rápida</span>
        </button>
        <button onClick={() => setView(ViewState.WEEKLY_PLAN)} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3">
          <span className="text-3xl bg-blue-50 p-3 rounded-full">📅</span><span className="font-bold text-gray-700">Cardápio Semanal</span>
        </button>
      </div>
      {!user?.isPremium && <AdBanner type="banner" />}
      {weeklyMenu && (
        <div onClick={() => setView(ViewState.WEEKLY_PLAN)} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer mt-8">
          <p className="text-sm text-gray-500">Último: {new Date(weeklyMenu.createdAt).toLocaleDateString()}</p>
          <p className="text-chef-green font-medium mt-1">Ver cardápio →</p>
        </div>
      )}
    </div>
  );

  const renderIngredientInput = () => (
    <>
        <div className="flex gap-2 mb-4">
          <label htmlFor="ingredient-input" className="sr-only">Digite um ingrediente</label>
          <input 
            id="ingredient-input"
            aria-label="Adicionar ingrediente"
            value={currentIngredient} 
            onChange={(e) => setCurrentIngredient(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()} 
            placeholder="Ex: Frango, Batata..." 
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-chef-green" 
          />
          <button 
            onClick={handleAddIngredient} 
            aria-label="Adicionar"
            className="bg-chef-green text-white px-4 rounded-xl hover:bg-green-600"
          >
            +
          </button>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <input type="file" accept="image/*" multiple ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
          <button onClick={() => fileInputRef.current?.click()} className={`flex-1 py-2 rounded-lg border border-dashed flex items-center justify-center gap-2 text-sm ${user?.isPremium ? 'border-chef-green text-chef-green bg-green-50' : 'border-gray-300 text-gray-400 bg-gray-50'}`}>
            <span>📷</span> {user?.isPremium ? 'Analisar Fotos' : 'Foto (Premium)'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 min-h-[100px] content-start">
          {ingredients.map((ing, i) => (
            <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
              {ing} <button onClick={() => handleRemoveIngredient(i)} className="text-gray-400 hover:text-red-500">×</button>
            </span>
          ))}
        </div>
    </>
  );

  const renderFridge = () => (
    <div className="space-y-6 relative">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Minha Geladeira ❄️</h2>
        {renderIngredientInput()}
      </div>
      
      {/* Container de Dificuldade */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 relative z-10">
        <p className="text-xs font-bold text-gray-500 uppercase mb-3">Dificuldade</p>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map((diff) => (
            <button key={diff} onClick={() => setSelectedDifficulty(diff)} className={`flex-1 py-2 rounded-md text-xs font-bold transition-colors ${selectedDifficulty === diff ? 'bg-chef-green text-white shadow-md' : 'text-gray-400 hover:bg-gray-200'}`}>{diff}</button>
          ))}
        </div>
      </div>
      
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 flex justify-between items-center"><span>{error}</span><button onClick={() => setError(null)}>×</button></div>}
      
      {/* ESPAÇADOR GIGANTE PARA PERMITIR SCROLL ATÉ O FINAL SEM COLISÃO */}
      <div className="h-64 w-full"></div>

      {/* Botões Fixos com Fundo Desfocado (Para não misturar com o texto abaixo) */}
      <div className="fixed bottom-24 left-4 right-4 z-[100] max-w-[calc(28rem-2rem)] sm:mx-auto">
         <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/40">
           <div className="grid grid-cols-2 gap-4">
              <button onClick={() => generateQuick(false)} disabled={isLoading} className="bg-chef-orange text-white font-bold py-4 rounded-xl shadow-md hover:bg-orange-600 disabled:opacity-50 border border-white/20 active:scale-95 transition-transform">
                {isLoading ? <LoadingSpinner /> : 'Receita Rápida'}
              </button>
              <button onClick={() => handleGenerateWeeklyClick(false)} disabled={isLoading} className="bg-chef-green text-white font-bold py-4 rounded-xl shadow-md hover:bg-green-600 disabled:opacity-50 border border-white/20 active:scale-95 transition-transform">
                {isLoading ? <LoadingSpinner /> : 'Semanal'}
              </button>
           </div>
         </div>
      </div>
    </div>
  );

  const renderQuickRecipeView = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-chef-orange">Modo Expresso ⚡</h2>
        <p className="text-sm text-gray-500 mb-4">Adicione ingredientes para uma receita imediata.</p>
        {renderIngredientInput()}
      </div>
      <div className="bg-white p-4 rounded-xl border border-gray-200 relative z-10">
        <p className="text-xs font-bold text-gray-500 uppercase mb-3">Dificuldade</p>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map((diff) => (
            <button key={diff} onClick={() => setSelectedDifficulty(diff)} className={`flex-1 py-2 rounded-md text-xs font-bold transition-colors ${selectedDifficulty === diff ? 'bg-chef-green text-white shadow-md' : 'text-gray-400 hover:bg-gray-200'}`}>{diff}</button>
          ))}
        </div>
      </div>
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 flex justify-between items-center"><span>{error}</span><button onClick={() => setError(null)}>×</button></div>}
      
      <div className="h-48 w-full"></div>
      
      <div className="fixed bottom-24 left-4 right-4 z-[100] max-w-[calc(28rem-2rem)] sm:mx-auto">
        <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/40">
           <button onClick={() => generateQuick(false)} disabled={isLoading} className="w-full bg-chef-orange text-white font-bold py-4 rounded-xl shadow-md hover:bg-orange-600 disabled:opacity-50 border border-white/20">
             {isLoading ? <LoadingSpinner /> : 'Gerar Receita Agora'}
           </button>
        </div>
      </div>
    </div>
  );

  const renderRecipeDetails = () => {
    if (!generatedRecipe) return null;
    return (
      <div className="animate-slideUp space-y-6">
        <button onClick={() => setView(ViewState.HOME)} className="text-gray-500 mb-2 hover:text-gray-800 no-print">← Voltar</button>
        <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100">
          <div className="bg-chef-orange p-6 text-white relative">
            <h2 className="text-2xl font-bold pr-12">{generatedRecipe.title}</h2>
            <div className="flex gap-4 mt-4 text-sm font-medium opacity-90"><span className="bg-white/20 px-3 py-1 rounded-full">{generatedRecipe.prepTime}</span><span className="bg-white/20 px-3 py-1 rounded-full">{generatedRecipe.difficulty}</span></div>
            <button onClick={() => window.print()} className="absolute top-6 right-6 bg-white/20 p-2 rounded-full no-print">🖨️</button>
          </div>
          <div className="p-6 space-y-6">
            <p className="text-gray-600 italic border-l-4 border-chef-orange pl-4">{generatedRecipe.description}</p>
            {user?.isPremium && generatedRecipe.calories && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 grid grid-cols-4 gap-2 text-center">
                <div><div className="text-lg font-bold">{generatedRecipe.calories}</div><div className="text-[10px]">Kcal</div></div>
                <div><div className="text-lg font-bold">{generatedRecipe.macros?.protein}</div><div className="text-[10px]">Prot</div></div>
                <div><div className="text-lg font-bold">{generatedRecipe.macros?.carbs}</div><div className="text-[10px]">Carb</div></div>
                <div><div className="text-lg font-bold">{generatedRecipe.macros?.fat}</div><div className="text-[10px]">Gord</div></div>
              </div>
            )}
            {!user?.isPremium && <GoogleAdPlaceholder />}
            <div><h3 className="font-bold text-gray-800 mb-3 text-chef-orange">Ingredientes</h3><ul className="space-y-2">{generatedRecipe.ingredients.map((ing, i) => <li key={i} className="flex gap-3"><input type="checkbox" />{ing}</li>)}</ul></div>
            <hr />
            <div><h3 className="font-bold text-gray-800 mb-3 text-chef-orange">Modo de Preparo</h3><div className="space-y-4">{generatedRecipe.instructions.map((step, i) => <div key={i} className="flex gap-4"><span className="w-6 h-6 rounded-full bg-orange-100 text-chef-orange font-bold flex items-center justify-center">{i + 1}</span><p className="text-gray-600 text-sm">{step}</p></div>)}</div></div>
          </div>
        </div>
      </div>
    );
  };

  const renderWeeklyPlan = () => {
    if (!weeklyMenu) return (
      <div className="text-center py-12 px-4">
        <h2 className="text-2xl font-bold mb-2">Nenhum plano ativo</h2>
        <div className="flex flex-col gap-4 max-w-xs mx-auto mt-8">
           <button onClick={() => setView(ViewState.FRIDGE)} className="bg-chef-green text-white py-3 rounded-xl font-bold">Ir para Geladeira</button>
           <button onClick={() => setView(ViewState.MENU_HISTORY)} className="border border-gray-300 py-3 rounded-xl font-bold">Ver Histórico</button>
        </div>
      </div>
    );
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-2 no-print">
          <div><h2 className="text-2xl font-bold text-gray-800">Cardápio</h2><p className="text-xs text-gray-400">{new Date(weeklyMenu.createdAt).toLocaleDateString()}</p></div>
          <div className="flex gap-2">
            <button onClick={() => setView(ViewState.MENU_HISTORY)} className="bg-gray-100 p-2 rounded-full">📜</button>
            <button onClick={() => window.print()} className="bg-blue-50 p-2 rounded-full text-blue-600">🖨️</button>
            <button onClick={() => handleDeleteMenu(weeklyMenu.id)} className="bg-red-50 p-2 rounded-full text-red-500">🗑️</button>
          </div>
        </div>
        <button onClick={() => setView(ViewState.SHOPPING_LIST)} className="w-full bg-blue-50 text-blue-600 py-3 rounded-xl font-bold no-print">🛒 Ver Lista de Compras</button>
        {!user?.isPremium && <GoogleAdPlaceholder />}
        <div className="space-y-4">
          {weeklyMenu.days.map((day, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between"><h3 className="font-bold text-gray-700">{day.day}</h3></div>
              <div className="p-4 space-y-4">
                <div onClick={() => { setGeneratedRecipe(day.lunch); setView(ViewState.RECIPE_DETAILS); }} className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg"><p className="text-gray-800 font-medium">☀️ {day.lunch.title}</p></div>
                
                {/* Exibição de Calorias no Menu Semanal para Premium */}
                {user?.isPremium && day.lunch.calories && (
                  <div className="text-[10px] text-gray-500 pl-2">
                    {day.lunch.calories} Kcal | P: {day.lunch.macros?.protein} C: {day.lunch.macros?.carbs} G: {day.lunch.macros?.fat}
                  </div>
                )}

                <hr className="border-gray-100" />
                <div onClick={() => { setGeneratedRecipe(day.dinner); setView(ViewState.RECIPE_DETAILS); }} className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg"><p className="text-gray-800 font-medium">🌙 {day.dinner.title}</p></div>
                
                {/* Exibição de Calorias no Menu Semanal para Premium */}
                {user?.isPremium && day.dinner.calories && (
                  <div className="text-[10px] text-gray-500 pl-2">
                    {day.dinner.calories} Kcal | P: {day.dinner.macros?.protein} C: {day.dinner.macros?.carbs} G: {day.dinner.macros?.fat}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="print-only">
           <div className="print-header"><h1>Chef.ai - Cardápio</h1></div>
           {weeklyMenu.days.map((day, i) => (
             <div key={i} className="page-break mb-8">
               <h2 className="text-xl font-bold border-b-2 border-gray-300 mb-4 mt-8 uppercase">{day.day}</h2>
               <div className="mb-6"><h3 className="text-lg font-bold bg-gray-100 p-2">☀️ ALMOÇO: {day.lunch.title}</h3><ul className="text-sm list-disc pl-4">{day.lunch.ingredients.map(ing => <li key={ing}>{ing}</li>)}</ul><ol className="text-sm list-decimal pl-4">{day.lunch.instructions.map((step, idx) => <li key={idx}>{step}</li>)}</ol></div>
               <div><h3 className="text-lg font-bold bg-gray-100 p-2">🌙 JANTAR: {day.dinner.title}</h3><ul className="text-sm list-disc pl-4">{day.dinner.ingredients.map(ing => <li key={ing}>{ing}</li>)}</ul><ol className="text-sm list-decimal pl-4">{day.dinner.instructions.map((step, idx) => <li key={idx}>{step}</li>)}</ol></div>
             </div>
           ))}
           <div className="page-break"><h2 className="text-xl font-bold">🛒 Lista de Compras</h2><ul className="list-disc pl-5">{weeklyMenu.shoppingList.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
        </div>
      </div>
    );
  };

  const renderShoppingList = () => {
    if (!weeklyMenu) return null;
    return (
      <div className="space-y-6">
         <button onClick={() => setView(ViewState.WEEKLY_PLAN)} className="text-gray-500 mb-2">← Voltar</button>
         <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold mb-6">🛒 Lista de Compras</h2>
            <ul className="space-y-3 mb-8">{weeklyMenu.shoppingList.map((item, i) => <li key={i} className="flex gap-3 text-gray-700 border-b border-gray-50 p-2"><input type="checkbox" />{item}</li>)}</ul>
            <button onClick={handleShareList} className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold flex justify-center gap-2"><span>📲</span> WhatsApp</button>
         </div>
      </div>
    );
  };

  const renderPremium = () => (
    <div className="space-y-6 text-center">
      <div className="bg-gradient-to-b from-yellow-50 to-white border border-yellow-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-3xl font-bold mb-4">Premium 👑</h2>
        {/* LISTA DE BENEFÍCIOS ADICIONADA */}
        <div className="bg-white/50 rounded-xl p-4 mb-8 text-left space-y-3">
           <p className="flex items-center gap-2"><span className="text-chef-green">✅</span> Cardápios Ilimitados</p>
           <p className="flex items-center gap-2"><span className="text-chef-green">✅</span> Análise de Fotos (IA)</p>
           <p className="flex items-center gap-2"><span className="text-chef-green">✅</span> Sem Anúncios</p>
           <p className="flex items-center gap-2"><span className="text-chef-green">✅</span> Tabela Nutricional Completa</p>
        </div>
        <div className="space-y-4">
          {StripeService.PLANS.map(plan => (
            <a key={plan.id} href={StripeService.getPaymentLink(plan.id, session?.user?.email)} className="block no-underline group relative overflow-visible">
              <div className="border-2 rounded-xl p-4 group-hover:border-chef-green flex justify-between items-center transition-all bg-white group-hover:shadow-md relative overflow-hidden">
                {plan.savings && (
                  <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold shadow-sm z-10">
                    {plan.savings} OFF
                  </span>
                )}
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800">{plan.name}</h3>
                  </div>
                  <p className="text-xs text-gray-500">{plan.interval}</p>
                </div>
                <div className="text-right">
                   <span className="text-xl font-bold text-chef-green">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMenuHistory = () => (
    <div className="space-y-6">
      <button onClick={() => setView(ViewState.WEEKLY_PLAN)} className="text-gray-500 mb-2">← Voltar</button>
      <h2 className="text-2xl font-bold">Histórico</h2>
      {allMenus.length === 0 ? <p className="text-gray-500">Vazio.</p> : (
        <div className="space-y-3">
          {allMenus.map(menu => (
            <div key={menu.id} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center">
              <div><p className="font-bold">Semana de {new Date(menu.createdAt).toLocaleDateString()}</p></div>
              <div className="flex gap-2">
                <button onClick={() => { setWeeklyMenu(menu); setView(ViewState.WEEKLY_PLAN); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg">👁️</button>
                <button onClick={() => handleDeleteMenu(menu.id)} className="p-2 bg-red-50 text-red-500 rounded-lg">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {allMenus.length > 0 && <button onClick={handleDeleteAllMenus} className="w-full mt-8 bg-gray-100 text-red-500 py-3 rounded-xl font-bold">Apagar Tudo</button>}
    </div>
  );

  const renderCurrentView = () => {
    switch(view) {
      case ViewState.HOME: return renderHome();
      case ViewState.FRIDGE: return renderFridge();
      case ViewState.QUICK_RECIPE: return renderQuickRecipeView();
      case ViewState.WEEKLY_PLAN: return renderWeeklyPlan();
      case ViewState.RECIPE_DETAILS: return renderRecipeDetails();
      case ViewState.SHOPPING_LIST: return renderShoppingList();
      case ViewState.PREMIUM: return renderPremium();
      case ViewState.MENU_HISTORY: return renderMenuHistory();
      case ViewState.PROFILE: return (
        <div className="space-y-6">
           <h2 className="text-2xl font-bold">Perfil</h2>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"><p className="font-bold">{session?.user?.email}</p><p className="text-sm">{user?.isPremium ? 'Premium' : 'Gratuito'}</p></div>
           
           {/* SEÇÃO DE ALERGIAS */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
             <h3 className="font-bold mb-4 flex items-center gap-2">⚠️ Restrições Alimentares</h3>
             <div className="flex gap-2 mb-4">
               <label htmlFor="allergy-input" className="sr-only">Digite uma restrição alimentar</label>
               <input 
                 id="allergy-input"
                 aria-label="Adicionar restrição alimentar"
                 value={allergyInput}
                 onChange={(e) => setAllergyInput(e.target.value)}
                 placeholder="Ex: Camarão, Glúten..."
                 className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
               />
               <button 
                 onClick={handleAddAllergy} 
                 aria-label="Adicionar"
                 className="bg-red-50 text-red-500 font-bold px-4 rounded-lg hover:bg-red-100"
               >
                 +
               </button>
             </div>
             <div className="flex flex-wrap gap-2">
               {user?.allergies?.map((allergy, i) => (
                 <span key={i} className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-red-100">
                   {allergy} <button onClick={() => handleRemoveAllergy(i)}>×</button>
                 </span>
               ))}
               {(!user?.allergies || user.allergies.length === 0) && <p className="text-gray-400 text-xs italic">Nenhuma restrição cadastrada.</p>}
             </div>
           </div>

           {/* GERENCIAMENTO DE ASSINATURA E EXCLUSÃO */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
             {user?.isPremium && (
               <button 
                 onClick={() => {
                    if (STRIPE_PORTAL_URL.includes('SEU_LINK_AQUI')) {
                        alert("Link do portal não configurado no .env");
                        return;
                    }
                    window.location.href = STRIPE_PORTAL_URL;
                 }}
                 className="w-full block text-center bg-gray-50 text-chef-green font-bold py-3 rounded-xl border border-gray-200 hover:bg-green-50 mb-4"
               >
                 Gerenciar Assinatura (Cancelar)
               </button>
             )}
             
             <button onClick={handleDeleteAccount} className="w-full text-red-400 text-xs hover:text-red-600 underline">
               Excluir minha conta e dados
             </button>
           </div>

           <button onClick={handleLogout} className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl">Sair</button>
        </div>
      );
      case ViewState.PRIVACY: return (
        <div className="p-6 bg-white min-h-screen">
          <button onClick={() => setView(ViewState.HOME)} className="mb-4">← Voltar</button>
          <h1 className="text-2xl font-bold mb-6">Política de Privacidade</h1>
          <div className="space-y-4 text-gray-700">
            <p><strong>1. Coleta de Dados:</strong> Coletamos seu e-mail para autenticação via Supabase. Seus dados de ingredientes e receitas geradas são armazenados para fornecer o histórico.</p>
            <p><strong>2. Processamento de Imagens:</strong> As fotos enviadas para análise de geladeira são processadas temporariamente pela OpenAI e não são armazenadas permanentemente para fins de treinamento.</p>
            <p><strong>3. Pagamentos:</strong> Todas as transações são processadas via Stripe. Não armazenamos seus dados bancários.</p>
            <p><strong>4. Segurança:</strong> Utilizamos criptografia e regras de segurança rígidas (RLS) para proteger seus dados.</p>
            <p><strong>5. Exclusão:</strong> Você pode solicitar a exclusão da sua conta a qualquer momento na tela de Perfil.</p>
          </div>
        </div>
      );
      case ViewState.TERMS: return (
        <div className="p-6 bg-white min-h-screen">
          <button onClick={() => setView(ViewState.HOME)} className="mb-4">← Voltar</button>
          <h1 className="text-2xl font-bold mb-6">Termos de Uso</h1>
          <div className="space-y-4 text-gray-700">
            <p><strong>1. Aceitação:</strong> Ao usar o Chef.ai, você concorda com estes termos.</p>
            <p><strong>2. Isenção de Responsabilidade (IA):</strong> As receitas são geradas por Inteligência Artificial. <strong>Não somos nutricionistas.</strong> Verifique os ingredientes em caso de alergias graves.</p>
            <p><strong>3. Assinatura Premium:</strong> A cobrança é recorrente e gerenciada pelo Stripe. Você pode cancelar a qualquer momento para evitar cobranças futuras.</p>
            <p><strong>4. Uso Aceitável:</strong> É proibido usar o serviço para fins ilegais. Reservamo-nos o direito de suspender contas que violem as regras.</p>
          </div>
        </div>
      );
      default: return renderHome();
    }
  };

  return (
    <Layout activeView={view} onNavigate={setView} isPremium={user?.isPremium || false}>
      <div className="animate-fade-in pb-safe">{renderCurrentView()}</div>
      
      {/* Modal de Limite Atingido (Reward Ad) */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center relative overflow-hidden">
            <button onClick={() => setShowLimitModal(false)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">✕</button>
            <div className="text-4xl mb-4">🛑</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Limite Atingido!</h3>
            <p className="text-gray-500 text-sm mb-6">Você atingiu o limite do plano gratuito.</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => { setShowLimitModal(false); setView(ViewState.PREMIUM); }}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold py-3 rounded-xl shadow-md hover:scale-105 transition-transform"
              >
                👑 Seja Premium (Ilimitado)
              </button>
              
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">ou</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <button 
                onClick={() => { setShowLimitModal(false); setIsWatchingAd(true); }}
                className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl border border-gray-300 hover:bg-gray-200 flex items-center justify-center gap-2"
              >
                <span>📺</span> Assistir Anúncio (+1 Receita)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tela de Anúncio Intersticial (Reward) */}
      {isWatchingAd && (
        <AdInterstitial onFinish={handleAdFinish} />
      )}

      <div className="text-center text-[10px] text-gray-300 py-2 no-print">Versão 2.4 - A11y</div>
    </Layout>
  );
}
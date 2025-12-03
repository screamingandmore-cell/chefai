
import React, { useState, useEffect, useRef } from 'react';
import { Layout, GoogleAdPlaceholder } from './components/Layout';
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
        // Tenta logar automaticamente após cadastro
        try {
           await SupabaseService.signIn(email, password);
        } catch (ignore) {}
      }
      onLogin(); 
    } catch (err: any) {
      if (err.message && err.message.includes("Failed to fetch")) {
        setError("Erro de conexão. Verifique se o arquivo .env está configurado corretamente.");
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
              // Fallback para garantir que uma imagem carregue
              if (e.currentTarget.src.endsWith('icon-192.png')) {
                 e.currentTarget.src = '/icon-192.png.png'; // Tenta extensão dupla caso exista
              } else {
                 e.currentTarget.src = '/favicon.svg';
                 e.currentTarget.style.backgroundColor = 'transparent';
                 e.currentTarget.onerror = null;
              }
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
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);
  const [allMenus, setAllMenus] = useState<WeeklyMenu[]>([]); 
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

  const processIngredientInput = (input: string) => {
    return input.split(/[,;\n]+/).map(s => s.trim()).filter(s => s.length > 0);
  };

  const handleAddIngredient = () => {
    if (!currentIngredient.trim()) return;
    const newItems = processIngredientInput(currentIngredient);
    
    if (newItems.length > 0) {
      setIngredients(prev => [...prev, ...newItems]);
      setCurrentIngredient('');
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!user?.isPremium) {
      alert("A análise por foto é um recurso Premium 👑");
      setView(ViewState.PREMIUM);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const imagesBase64: string[] = [];
      const maxFiles = Math.min(files.length, 6);

      for (let i = 0; i < maxFiles; i++) {
        const file = files[i];
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        imagesBase64.push(base64);
      }

      const detectedIngredients = await OpenAIService.analyzeFridgeImage(imagesBase64);
      setIngredients(prev => [...new Set([...prev, ...detectedIngredients])]); 
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setError("Erro ao analisar imagens. Tente novamente.");
      setIsLoading(false);
    }
  };

  const generateQuick = async () => {
    if (!user || !session?.user) return;

    if (!user.isPremium && user.usage.quickRecipes >= 10) {
      alert("Limite de receitas rápidas atingido. Seja Premium para ilimitado!");
      setView(ViewState.PREMIUM);
      return;
    }

    let finalIngredients = [...ingredients];
    if (currentIngredient.trim()) {
       const extra = processIngredientInput(currentIngredient);
       finalIngredients = [...finalIngredients, ...extra];
       setIngredients(prev => [...prev, ...extra]);
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
      alert("Você já criou seu cardápio semanal gratuito. Seja Premium para criar mais!");
      setView(ViewState.PREMIUM);
      return;
    }

    let finalIngredients = [...ingredients];
    if (currentIngredient.trim()) {
       const extra = processIngredientInput(currentIngredient);
       finalIngredients = [...finalIngredients, ...extra];
       setIngredients(prev => [...prev, ...extra]);
       setCurrentIngredient('');
    }

    const isLongText = finalIngredients.length === 1 && finalIngredients[0].includes(' ');
    
    if (finalIngredients.length < 2 && !isLongText) {
      setError("Adicione pelo menos 2 ingredientes principais ou cole uma lista.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const menu = await OpenAIService.generateWeeklyMenu(
        finalIngredients, 
        user.allergies,
        user.isPremium
      );
      
      await SupabaseService.saveWeeklyMenu(session.user.id, menu);
      setWeeklyMenu(menu);
      setAllMenus(prev => [menu, ...prev]);

      const updatedUser = await SupabaseService.incrementUsage(session.user.id, 'weeklyMenus');
      setUser(updatedUser);
    } catch (err: any) {
      setError(err.message || "Erro ao gerar cardápio.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareList = () => {
    if (!weeklyMenu) return;
    
    const text = `🛒 *Lista de Compras - Chef.ai*\n\n${weeklyMenu.shoppingList.map(i => `- ${i}`).join('\n')}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Lista de Compras Chef.ai',
        text: text
      }).catch(console.error);
    } else {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!confirm("Tem certeza que deseja apagar este cardápio?")) return;
    
    try {
      await SupabaseService.deleteWeeklyMenu(menuId);
      
      const newHistory = allMenus.filter(m => m.id !== menuId);
      setAllMenus(newHistory);
      
      if (weeklyMenu?.id === menuId) {
        setWeeklyMenu(newHistory.length > 0 ? newHistory[0] : null);
      }
    } catch (e: any) {
      alert("Erro ao excluir: " + e.message);
    }
  };

  const handleDeleteAllMenus = async () => {
    if (!session?.user) return;
    if (!confirm("ATENÇÃO: Isso apagará TODO o seu histórico de cardápios. Continuar?")) return;

    try {
      await SupabaseService.deleteAllUserMenus(session.user.id);
      setAllMenus([]);
      setWeeklyMenu(null);
      alert("Histórico limpo com sucesso.");
    } catch (e: any) {
      alert("Erro: " + e.message);
    }
  };

  if (!session) {
    return <AuthScreen onLogin={() => {}} />;
  }

  // --- RENDERIZADORES ---

  const renderHome = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-chef-green to-teal-500 rounded-2xl p-6 text-white shadow-lg transform hover:scale-[1.02] transition-transform">
        <h2 className="text-2xl font-bold mb-2">O que vamos cozinhar hoje?</h2>
        <p className="text-green-50 opacity-90 mb-6">Evite desperdícios e economize tempo.</p>
        <button 
          onClick={() => setView(ViewState.FRIDGE)}
          className="bg-white text-chef-green px-6 py-3 rounded-xl font-bold shadow-md hover:bg-gray-50 transition-colors w-full sm:w-auto"
        >
          Abrir Geladeira
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setView(ViewState.QUICK_RECIPE)} 
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-chef-green transition-colors flex flex-col items-center gap-3"
        >
          <span className="text-3xl bg-orange-50 p-3 rounded-full">🍳</span>
          <span className="font-bold text-gray-700">Receita Rápida</span>
        </button>
        <button 
          onClick={() => setView(ViewState.WEEKLY_PLAN)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-chef-green transition-colors flex flex-col items-center gap-3"
        >
          <span className="text-3xl bg-blue-50 p-3 rounded-full">📅</span>
          <span className="font-bold text-gray-700">Cardápio Semanal</span>
        </button>
      </div>

      {!user?.isPremium && <GoogleAdPlaceholder label="Anúncio Google - Feed Principal" />}

      {weeklyMenu && (
        <div className="mt-8">
          <h3 className="font-bold text-gray-800 mb-4">Seu Cardápio Atual</h3>
          <div 
            onClick={() => setView(ViewState.WEEKLY_PLAN)}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <p className="text-sm text-gray-500">Criado em: {new Date(weeklyMenu.createdAt).toLocaleDateString()}</p>
            <p className="text-chef-green font-medium mt-1">Ver planejamento completo →</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderFridge = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          Minha Geladeira <span className="text-2xl">❄️</span>
        </h2>
        
        <div className="flex gap-2 mb-4">
          <input
            value={currentIngredient}
            onChange={(e) => setCurrentIngredient(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()}
            placeholder="Ex: Frango, Batata..."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-chef-green transition-shadow"
          />
          <button 
            onClick={handleAddIngredient}
            className="bg-chef-green text-white px-4 rounded-xl hover:bg-green-600 transition-colors"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <span className="text-xs text-gray-400 uppercase font-bold">Ou use a câmera (Premium)</span>
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleImageUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 py-2 rounded-lg border border-dashed flex items-center justify-center gap-2 text-sm transition-colors ${
              user?.isPremium 
                ? 'border-chef-green text-chef-green bg-green-50 hover:bg-green-100' 
                : 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
            }`}
          >
            <span>📷</span> {user?.isPremium ? 'Analisar Foto' : 'Foto (Bloqueado)'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 min-h-[100px] content-start">
          {ingredients.map((ing, i) => (
            <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 animate-fadeIn">
              {ing} 
              <button onClick={() => handleRemoveIngredient(i)} className="text-gray-400 hover:text-red-500">×</button>
            </span>
          ))}
          {ingredients.length === 0 && <span className="text-gray-400 text-sm italic">Adicione ingredientes para começar...</span>}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <p className="text-xs font-bold text-gray-500 uppercase mb-3">Nível de Dificuldade</p>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${
                selectedDifficulty === diff 
                  ? 'bg-white text-gray-800 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 flex justify-between items-center animate-shake">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold p-1">×</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sticky bottom-4">
        <button 
          onClick={generateQuick} 
          disabled={isLoading}
          className="bg-chef-orange text-white font-bold py-4 rounded-xl shadow-lg hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {isLoading ? <LoadingSpinner /> : 'Receita Rápida'}
        </button>
        <button 
          onClick={handleGenerateWeeklyClick} 
          disabled={isLoading}
          className="bg-chef-green text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {isLoading ? <LoadingSpinner /> : 'Gerar Semanal'}
        </button>
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
            <div className="flex gap-4 mt-4 text-sm font-medium opacity-90">
              <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">⏱️ {generatedRecipe.prepTime}</span>
              <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">📊 {generatedRecipe.difficulty}</span>
            </div>
            <button onClick={() => window.print()} className="absolute top-6 right-6 bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors no-print">
              🖨️
            </button>
          </div>

          <div className="p-6 space-y-6">
            <p className="text-gray-600 italic border-l-4 border-chef-orange pl-4">{generatedRecipe.description}</p>

            {user?.isPremium && generatedRecipe.calories && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <h4 className="text-chef-green font-bold text-sm uppercase mb-3">🥗 Informação Nutricional</h4>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <div className="text-lg font-bold text-gray-800">{generatedRecipe.calories}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Kcal</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <div className="text-lg font-bold text-gray-800">{generatedRecipe.macros?.protein || '-'}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Prot</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <div className="text-lg font-bold text-gray-800">{generatedRecipe.macros?.carbs || '-'}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Carb</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <div className="text-lg font-bold text-gray-800">{generatedRecipe.macros?.fat || '-'}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Gord</div>
                  </div>
                </div>
              </div>
            )}

            {!user?.isPremium && <GoogleAdPlaceholder label="Anúncio - Detalhes da Receita" />}

            <div>
              <h3 className="font-bold text-gray-800 mb-3 text-chef-orange flex items-center gap-2">
                <span>•</span> Ingredientes
              </h3>
              <ul className="space-y-2">
                {generatedRecipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex gap-3 text-gray-600 items-start">
                    <input type="checkbox" className="mt-1.5 accent-chef-orange w-4 h-4 shrink-0" />
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            <hr className="border-gray-100" />

            <div>
              <h3 className="font-bold text-gray-800 mb-3 text-chef-orange flex items-center gap-2">
                <span>•</span> Modo de Preparo
              </h3>
              <div className="space-y-4">
                {generatedRecipe.instructions.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-chef-orange font-bold text-sm flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="text-gray-600 text-sm leading-relaxed pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWeeklyPlan = () => {
    if (!weeklyMenu) {
      return (
        <div className="text-center py-12 px-4 animate-fadeIn">
          <div className="text-6xl mb-4 grayscale opacity-50">📅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Nenhum plano ativo</h2>
          <p className="text-gray-500 mb-8">Crie um cardápio baseado na sua geladeira.</p>
          <div className="flex flex-col gap-4 max-w-xs mx-auto">
             <button onClick={() => setView(ViewState.FRIDGE)} className="bg-chef-green text-white py-3 rounded-xl font-bold shadow-md hover:bg-green-600 transition-colors">
               Ir para Geladeira
             </button>
             {allMenus.length > 0 && (
               <button onClick={() => setView(ViewState.MENU_HISTORY)} className="bg-white text-gray-600 border border-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                 Ver Histórico
               </button>
             )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-2 no-print">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Cardápio Semanal</h2>
            <p className="text-xs text-gray-400">Semana de {new Date(weeklyMenu.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView(ViewState.MENU_HISTORY)} className="bg-gray-100 p-2 rounded-full text-gray-600 hover:bg-gray-200" title="Histórico">📜</button>
            <button onClick={() => window.print()} className="bg-blue-50 p-2 rounded-full text-blue-600 hover:bg-blue-100" title="Imprimir PDF">🖨️</button>
            <button onClick={() => handleDeleteMenu(weeklyMenu.id)} className="bg-red-50 p-2 rounded-full text-red-500 hover:bg-red-100" title="Excluir">🗑️</button>
          </div>
        </div>

        <button 
          onClick={() => setView(ViewState.SHOPPING_LIST)}
          className="w-full bg-blue-50 text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-100 flex justify-center gap-2 no-print transition-colors"
        >
          <span>🛒</span> Ver Lista de Compras
        </button>

        {!user?.isPremium && <GoogleAdPlaceholder label="Anúncio - Topo do Cardápio" />}

        <div className="space-y-4">
          {weeklyMenu.days.map((day, i) => {
            const dailyCals = parseMacro(day.lunch.calories?.toString()) + parseMacro(day.dinner.calories?.toString());
            
            return (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700">{day.day}</h3>
                  {user?.isPremium && dailyCals > 0 && (
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {dailyCals} kcal
                    </span>
                  )}
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Almoço */}
                  <div 
                    onClick={() => { setGeneratedRecipe(day.lunch); setView(ViewState.RECIPE_DETAILS); }}
                    className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">☀️</span>
                      <span className="text-xs font-bold text-gray-400 uppercase group-hover:text-chef-green">Almoço</span>
                    </div>
                    <p className="text-gray-800 font-medium pl-8 group-hover:text-chef-green">{day.lunch.title}</p>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Jantar */}
                  <div 
                    onClick={() => { setGeneratedRecipe(day.dinner); setView(ViewState.RECIPE_DETAILS); }}
                    className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🌙</span>
                      <span className="text-xs font-bold text-gray-400 uppercase group-hover:text-chef-green">Jantar</span>
                    </div>
                    <p className="text-gray-800 font-medium pl-8 group-hover:text-chef-green">{day.dinner.title}</p>
                  </div>
                  
                  {/* Resumo Macros Diário */}
                  {user?.isPremium && (
                    <div className="flex justify-around text-[10px] text-gray-400 pt-2 border-t border-dashed border-gray-100">
                       <span>P: {parseMacro(day.lunch.macros?.protein) + parseMacro(day.dinner.macros?.protein)}g</span>
                       <span>C: {parseMacro(day.lunch.macros?.carbs) + parseMacro(day.dinner.macros?.carbs)}g</span>
                       <span>G: {parseMacro(day.lunch.macros?.fat) + parseMacro(day.dinner.macros?.fat)}g</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ÁREA DE IMPRESSÃO OCULTA (SÓ APARECE NO PDF) */}
        <div className="print-only">
           <div className="print-header">
             <h1>Chef.ai - Cardápio Semanal</h1>
             <p>Planejamento gerado com Inteligência Artificial</p>
           </div>
           
           {weeklyMenu.days.map((day, i) => (
             <div key={i} className="page-break mb-8">
               <h2 className="text-xl font-bold border-b-2 border-gray-300 mb-4 mt-8 uppercase">{day.day}</h2>
               
               <div className="mb-6">
                 <h3 className="text-lg font-bold bg-gray-100 p-2">☀️ ALMOÇO: {day.lunch.title}</h3>
                 <p className="italic text-sm my-2">{day.lunch.description}</p>
                 <strong className="text-sm block mt-2">Ingredientes:</strong>
                 <ul className="text-sm list-disc pl-4 mb-2">
                   {day.lunch.ingredients.map(ing => <li key={ing}>{ing}</li>)}
                 </ul>
                 <strong className="text-sm block mt-2">Preparo:</strong>
                 <ol className="text-sm list-decimal pl-4">
                   {day.lunch.instructions.map((step, idx) => <li key={idx}>{step}</li>)}
                 </ol>
               </div>

               <div>
                 <h3 className="text-lg font-bold bg-gray-100 p-2">🌙 JANTAR: {day.dinner.title}</h3>
                 <p className="italic text-sm my-2">{day.dinner.description}</p>
                 <strong className="text-sm block mt-2">Ingredientes:</strong>
                 <ul className="text-sm list-disc pl-4 mb-2">
                   {day.dinner.ingredients.map(ing => <li key={ing}>{ing}</li>)}
                 </ul>
                 <strong className="text-sm block mt-2">Preparo:</strong>
                 <ol className="text-sm list-decimal pl-4">
                   {day.dinner.instructions.map((step, idx) => <li key={idx}>{step}</li>)}
                 </ol>
               </div>
             </div>
           ))}

           <div className="page-break">
             <h2 className="text-xl font-bold border-b-2 border-gray-300 mb-4 mt-8 uppercase">🛒 Lista de Compras Completa</h2>
             <ul className="list-disc pl-5">
               {weeklyMenu.shoppingList.map((item, i) => <li key={i} className="mb-1">{item}</li>)}
             </ul>
           </div>
        </div>
      </div>
    );
  };

  const renderShoppingList = () => {
    if (!weeklyMenu) return null;
    return (
      <div className="space-y-6">
         <button onClick={() => setView(ViewState.WEEKLY_PLAN)} className="text-gray-500 mb-2 hover:text-gray-800">← Voltar</button>
         
         <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-3xl">🛒</span> Lista de Compras
            </h2>
            
            <ul className="space-y-3 mb-8">
              {weeklyMenu.shoppingList.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700 p-2 hover:bg-gray-50 border-b border-gray-50 last:border-0 rounded-lg transition-colors">
                  <input type="checkbox" className="mt-1.5 w-5 h-5 accent-chef-green cursor-pointer" />
                  <span className="text-lg">{item}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={handleShareList}
              className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold hover:bg-[#128C7E] flex justify-center gap-2 shadow-md transition-colors"
            >
              <span>📲</span> Compartilhar no WhatsApp
            </button>
         </div>
      </div>
    );
  };

  const renderPremium = () => (
    <div className="space-y-6 animate-slideUp text-center">
      <div className="bg-gradient-to-b from-yellow-50 to-white border border-yellow-200 rounded-3xl p-8 shadow-sm">
        <div className="text-5xl mb-4">👑</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Seja Chef.ai Premium</h2>
        <p className="text-gray-500 mb-8">Desbloqueie todo o potencial da sua cozinha.</p>
        
        <div className="space-y-4 text-left mb-8">
           <p className="flex items-center gap-2"><span className="text-green-500">✓</span> Cardápios semanais ilimitados</p>
           <p className="flex items-center gap-2"><span className="text-green-500">✓</span> Análise de geladeira por Foto</p>
           <p className="flex items-center gap-2"><span className="text-green-500">✓</span> Sem anúncios</p>
           <p className="flex items-center gap-2"><span className="text-green-500">✓</span> Tabela Nutricional completa</p>
        </div>

        <div className="space-y-4">
          {StripeService.PLANS.map(plan => (
            <a 
              key={plan.id}
              href={StripeService.getPaymentLink(plan.id, session?.user?.email)}
              className="no-underline block"
            >
              <div className={`border-2 rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] relative ${plan.id === 'annual' ? 'border-chef-green bg-green-50' : 'border-gray-200 hover:border-chef-green'}`}>
                {plan.savings && (
                  <span className="absolute -top-3 right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                    ECO {plan.savings}
                  </span>
                )}
                <div className="flex justify-between items-center">
                  <div className="text-left">
                    <h3 className="font-bold text-gray-800">{plan.name}</h3>
                    <p className="text-xs text-gray-500">Cobrado por {plan.interval}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-chef-green">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                    <span className="text-xs text-gray-400 block">/{plan.interval.split(' ')[0]}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-gray-800">Meu Perfil</h2>
       
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
         <div className="flex items-center gap-4 mb-6">
           <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl border-2 border-white shadow-sm">👤</div>
           <div>
             <p className="font-bold text-gray-800 break-all">{session?.user?.email}</p>
             <p className={`text-sm ${user?.isPremium ? 'text-chef-green font-bold' : 'text-gray-500'}`}>
               {user?.isPremium ? 'Membro Premium 👑' : 'Plano Gratuito'}
             </p>
           </div>
         </div>
         
         <div className="space-y-4">
           <div>
             <label className="block text-sm font-bold text-gray-700 mb-2">Minhas Alergias</label>
             <input 
               placeholder="Ex: Amendoim, Lactose..." 
               className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-chef-green outline-none"
               value={user?.allergies?.join(', ') || ''}
               onChange={(e) => {
                 const allergies = e.target.value.split(',').map(s => s.trim());
                 if (user && session?.user) {
                   const updated = { ...user, allergies };
                   setUser(updated);
                   SupabaseService.updateUserProfile(session.user.id, updated);
                 }
               }}
             />
           </div>
         </div>
       </div>

       <div className="grid grid-cols-2 gap-4">
         <button onClick={handleDeleteAllMenus} className="bg-red-50 text-red-500 font-bold py-3 rounded-xl hover:bg-red-100 transition-colors">
           Limpar Histórico
         </button>
         <button onClick={handleLogout} className="bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">
           Sair da Conta
         </button>
       </div>
    </div>
  );

  const renderMenuHistory = () => (
    <div className="space-y-6">
      <button onClick={() => setView(ViewState.WEEKLY_PLAN)} className="text-gray-500 mb-2 hover:text-gray-800">← Voltar</button>
      <h2 className="text-2xl font-bold text-gray-800">Histórico de Cardápios</h2>
      
      {allMenus.length === 0 ? (
        <p className="text-gray-500 italic text-center py-8">Nenhum cardápio salvo.</p>
      ) : (
        <div className="space-y-3">
          {allMenus.map(menu => (
            <div key={menu.id} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center hover:shadow-md transition-shadow">
              <div>
                <p className="font-bold text-gray-700">Semana de {new Date(menu.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-gray-400">{menu.days.length} dias planejados</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setWeeklyMenu(menu); setView(ViewState.WEEKLY_PLAN); }}
                  className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  title="Ver"
                >
                  👁️
                </button>
                <button 
                  onClick={() => handleDeleteMenu(menu.id)}
                  className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
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
        <button onClick={handleDeleteAllMenus} className="w-full mt-8 bg-gray-100 text-red-500 py-3 rounded-xl font-bold hover:bg-red-50 border border-transparent hover:border-red-200 transition-all">
          Apagar Tudo
        </button>
      )}
    </div>
  );

  const renderPrivacyPolicy = () => (
    <div className="p-6 bg-white min-h-screen">
      <button onClick={() => setView(ViewState.HOME)} className="text-gray-500 mb-4">← Voltar ao Início</button>
      <h1 className="text-2xl font-bold mb-4 text-chef-green">Política de Privacidade</h1>
      <div className="prose text-sm text-gray-600 space-y-4">
        <p><strong>1. Introdução:</strong> O Chef.ai valoriza sua privacidade. Esta política descreve como coletamos e usamos seus dados.</p>
        <p><strong>2. Dados Coletados:</strong> Coletamos apenas seu e-mail para autenticação e as preferências alimentares (ingredientes, alergias) para gerar receitas.</p>
        <p><strong>3. Uso de IA:</strong> As fotos enviadas são processadas pela OpenAI apenas para identificação de ingredientes e não são armazenadas permanentemente para treinamento.</p>
        <p><strong>4. Pagamentos:</strong> Todas as transações são processadas pelo Stripe. Não temos acesso aos seus dados bancários.</p>
        <p><strong>5. Contato:</strong> Para excluir sua conta, contate o suporte na loja de aplicativos.</p>
      </div>
    </div>
  );

  const renderTermsOfUse = () => (
    <div className="p-6 bg-white min-h-screen">
      <button onClick={() => setView(ViewState.HOME)} className="text-gray-500 mb-4">← Voltar ao Início</button>
      <h1 className="text-2xl font-bold mb-4 text-chef-green">Termos de Uso</h1>
      <div className="prose text-sm text-gray-600 space-y-4">
        <p><strong>1. Aceitação:</strong> Ao usar o Chef.ai, você concorda com estes termos.</p>
        <p><strong>2. Isenção de Responsabilidade Médica:</strong> As receitas e informações nutricionais são geradas por Inteligência Artificial e podem conter imprecisões. Este aplicativo não substitui aconselhamento nutricional ou médico profissional.</p>
        <p><strong>3. Alergias:</strong> O usuário é responsável por verificar todos os ingredientes antes do consumo. O Chef.ai não se responsabiliza por reações alérgicas.</p>
        <p><strong>4. Assinatura:</strong> O plano Premium é renovado automaticamente até que seja cancelado pelo usuário junto ao provedor de pagamento.</p>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch(view) {
      case ViewState.HOME: return <div key="home" className="animate-fadeIn">{renderHome()}</div>;
      case ViewState.FRIDGE: return <div key="fridge" className="animate-fadeIn">{renderFridge()}</div>;
      case ViewState.QUICK_RECIPE: return <div key="quick" className="animate-fadeIn">{renderFridge()}</div>;
      case ViewState.WEEKLY_PLAN: return <div key="weekly" className="animate-fadeIn">{renderWeeklyPlan()}</div>;
      case ViewState.RECIPE_DETAILS: return <div key="details" className="animate-fadeIn">{renderRecipeDetails()}</div>;
      case ViewState.SHOPPING_LIST: return <div key="shopping" className="animate-fadeIn">{renderShoppingList()}</div>;
      case ViewState.PREMIUM: return <div key="premium" className="animate-fadeIn">{renderPremium()}</div>;
      case ViewState.PROFILE: return <div key="profile" className="animate-fadeIn">{renderProfile()}</div>;
      case ViewState.PRIVACY: return <div key="privacy" className="animate-fadeIn">{renderPrivacyPolicy()}</div>;
      case ViewState.TERMS: return <div key="terms" className="animate-fadeIn">{renderTermsOfUse()}</div>;
      case ViewState.MENU_HISTORY: return <div key="history" className="animate-fadeIn">{renderMenuHistory()}</div>;
      default: return renderHome();
    }
  };

  return (
    <Layout activeView={view} onNavigate={setView} isPremium={user?.isPremium || false}>
      <div className="animate-fade-in pb-safe">
        {renderCurrentView()}
      </div>
    </Layout>
  );
}

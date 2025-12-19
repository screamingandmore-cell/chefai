
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { ViewState, UserProfile, Recipe, WeeklyMenu, Difficulty, DietGoal } from '@/types';
import * as SupabaseService from '@/services/supabase';
import { useChefActions } from '@/services/hooks/useChefActions';

// Views
import { AuthScreen } from '@/components/AuthScreen';
import { HomeView } from '@/components/views/HomeView';
import { FridgeView } from '@/components/views/FridgeView';
import { QuickRecipeView } from '@/components/views/QuickRecipeView';
import { WeeklyPlanView } from '@/components/views/WeeklyPlanView';
import { RecipeDetailsView } from '@/components/views/RecipeDetailsView';
import { ProfileView } from '@/components/views/ProfileView';
import { ShoppingListView } from '@/components/views/ShoppingListView';
import { HistoryView } from '@/components/views/HistoryView';
import { PremiumView } from '@/components/views/PremiumView';

const LOADING_MESSAGES = [
  "Chef está afiando as facas...",
  "Escolhendo os melhores temperos...",
  "Consultando o livro secreto de receitas...",
  "Grelhando as ideias...",
  "Quase pronto! O cheiro está ótimo...",
];

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [viewHistory, setViewHistory] = useState<ViewState[]>([ViewState.HOME]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [hasApiKey, setHasApiKey] = useState(false);
  
  const [allMenus, setAllMenus] = useState<WeeklyMenu[]>([]); 
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [dietGoal, setDietGoal] = useState<DietGoal>('balanced');

  // Função de navegação simulando behavior do Router
  const navigate = useCallback((to: ViewState | number) => {
    if (typeof to === 'number') {
      if (to === -1) {
        setViewHistory(prev => {
          if (prev.length <= 1) {
            setView(ViewState.HOME);
            return [ViewState.HOME];
          }
          const newHistory = [...prev];
          newHistory.pop();
          const prevView = newHistory[newHistory.length - 1];
          setView(prevView);
          return newHistory;
        });
      }
    } else {
      const isMainView = [ViewState.HOME, ViewState.FRIDGE, ViewState.WEEKLY_PLAN, ViewState.PROFILE].includes(to);
      if (isMainView) {
        setViewHistory([to]);
      } else {
        setViewHistory(prev => [...prev, to]);
      }
      setView(to);
    }
  }, []);

  // Verificação simples da API Key via variáveis de ambiente
  useEffect(() => {
    if ((import.meta as any).env.VITE_GEMINI_API_KEY) {
      setHasApiKey(true);
    }
  }, []);

  const loadUserData = useCallback(async (userId: string) => {
    try {
      const [profile, menus] = await Promise.all([
        SupabaseService.getUserProfile(userId),
        SupabaseService.getWeeklyMenus(userId)
      ]);
      setUser(profile);
      setAllMenus(menus);
      if (menus.length > 0) setWeeklyMenu(menus[0]);
    } catch (e) {
      console.error("Erro no Sync inicial", e);
    }
  }, []);

  const handleProfileRefresh = useCallback(() => {
    if (session?.user?.id) loadUserData(session.user.id);
  }, [session, loadUserData]);

  const {
    ingredients,
    isLoading,
    handleAddIngredients,
    handleRemoveIngredient,
    handleImageUpload,
    generateQuick,
    generateWeekly
  } = useChefActions(user, session, handleProfileRefresh);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  useEffect(() => {
    SupabaseService.getUserSession().then(s => {
      setSession(s);
      if (s?.user?.id) loadUserData(s.user.id);
    });

    const { data: { subscription } } = SupabaseService.supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setUser(null);
        setAllMenus([]);
        setWeeklyMenu(null);
        setGeneratedRecipe(null);
        navigate(ViewState.HOME);
      } else {
        loadUserData(newSession.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData, navigate]);

  const handleGenerateQuick = async () => {
    if (!hasApiKey) {
      alert("Chave de API não configurada. Verifique seu arquivo .env");
      return;
    }
    
    const recipe = await generateQuick(difficulty, dietGoal);
    if (recipe) {
      setGeneratedRecipe(recipe);
      navigate(ViewState.RECIPE_DETAILS);
    }
  };

  const handleGenerateWeekly = async () => {
    if (!hasApiKey) {
      alert("Chave de API não configurada. Verifique seu arquivo .env");
      return;
    }
    
    const menu = await generateWeekly(difficulty, dietGoal);
    if (menu) {
      setWeeklyMenu(menu);
      setAllMenus(prev => [menu, ...prev]);
      navigate(ViewState.WEEKLY_PLAN);
    }
  };

  const currentView = useMemo(() => {
    switch(view) {
      case ViewState.HOME: return <HomeView user={user} weeklyMenu={weeklyMenu} onNavigate={navigate} />;
      case ViewState.PREMIUM: return <PremiumView user={user} onNavigate={navigate} />;
      case ViewState.FRIDGE:
        return (
          <FridgeView 
            user={user}
            session={session}
            onUpdateUser={setUser}
            ingredients={ingredients}
            onAddIngredient={handleAddIngredients}
            onRemoveIngredient={handleRemoveIngredient}
            onImageUpload={handleImageUpload}
            dietGoal={dietGoal}
            setDietGoal={setDietGoal}
            isLoading={isLoading}
            isPremium={user?.isPremium || false}
            onNavigate={navigate}
            onGenerateQuick={handleGenerateQuick}
            onGenerateWeekly={handleGenerateWeekly}
          />
        );
      case ViewState.QUICK_RECIPE:
        return (
          <QuickRecipeView 
            user={user}
            session={session}
            onUpdateUser={setUser}
            ingredients={ingredients}
            onAddIngredient={handleAddIngredients}
            onRemoveIngredient={handleRemoveIngredient}
            onImageUpload={handleImageUpload}
            selectedDifficulty={difficulty}
            setSelectedDifficulty={setDifficulty}
            dietGoal={dietGoal}
            setDietGoal={setDietGoal}
            onGenerateQuick={handleGenerateQuick}
            isLoading={isLoading}
            isPremium={user?.isPremium || false}
            onNavigate={navigate}
          />
        );
      case ViewState.WEEKLY_PLAN:
        return (
          <WeeklyPlanView 
            weeklyMenu={weeklyMenu}
            onNavigate={navigate}
            onSelectRecipe={(r) => { setGeneratedRecipe(r); navigate(ViewState.RECIPE_DETAILS); }}
            onDeleteMenu={() => {}} 
            dietGoal={dietGoal}
            setDietGoal={setDietGoal}
            selectedDifficulty={difficulty}
            setSelectedDifficulty={setDifficulty}
            onGenerateWeekly={handleGenerateWeekly}
            isLoading={isLoading}
          />
        );
      case ViewState.SHOPPING_LIST:
        return <ShoppingListView menu={weeklyMenu} onBack={() => navigate(-1)} />;
      case ViewState.RECIPE_DETAILS: 
        return <RecipeDetailsView recipe={generatedRecipe} isPremium={user?.isPremium || false} onBack={() => navigate(-1)} />;
      case ViewState.PROFILE: 
        return <ProfileView 
          user={user} 
          session={session} 
          onLogout={SupabaseService.signOut} 
          onUpdateUser={setUser} 
          onDeleteAccount={SupabaseService.deleteAccount} 
          onNavigate={navigate}
        />;
      case ViewState.MENU_HISTORY:
        return <HistoryView 
          menus={allMenus} 
          onSelect={(m) => { setWeeklyMenu(m); navigate(ViewState.WEEKLY_PLAN); }}
          onDelete={(id) => {
            if (session?.user?.id) {
              SupabaseService.deleteWeeklyMenu(id, session.user.id);
              setAllMenus(prev => prev.filter(m => m.id !== id));
            }
          }}
          onBack={() => navigate(-1)}
        />;
      default: return <HomeView user={user} weeklyMenu={weeklyMenu} onNavigate={navigate} />;
    }
  }, [view, user, weeklyMenu, allMenus, ingredients, isLoading, difficulty, dietGoal, session, handleAddIngredients, handleRemoveIngredient, handleImageUpload, handleGenerateQuick, handleGenerateWeekly, navigate]);

  if (!session) return <AuthScreen onLogin={() => {}} />;

  return (
    <Layout activeView={view} onNavigate={navigate} isPremium={user?.isPremium || false}>
      {currentView}
      
      {isLoading && (
        <div className="fixed inset-0 z-[300] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <div className="w-24 h-24 mb-8 relative">
            <div className="absolute inset-0 border-4 border-chef-green/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-chef-green border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-4xl">👨‍🍳</div>
          </div>
          <h3 className="text-xl font-black text-gray-800 mb-2">Trabalhando nisso...</h3>
          <p className="text-gray-500 font-medium animate-pulse">{loadingMsg}</p>
        </div>
      )}
    </Layout>
  );
}

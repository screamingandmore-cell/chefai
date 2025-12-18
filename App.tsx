
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout, AdInterstitial } from '@/components/Layout';
import { ViewState, UserProfile, Recipe, WeeklyMenu, Difficulty, DietGoal } from '@/types';
import * as SupabaseService from '@/services/supabase';
import { useChefActions } from '@/services/hooks/useChefActions';

// Views
import { AuthScreen } from '@/components/AuthScreen';
import { HomeView } from '@/components/views/HomeView';
import { FridgeView } from '@/components/views/FridgeView';
import { WeeklyPlanView } from '@/components/views/WeeklyPlanView';
import { RecipeDetailsView } from '@/components/views/RecipeDetailsView';
import { ProfileView } from '@/components/views/ProfileView';
import { ShoppingListView } from '@/components/views/ShoppingListView';
import { HistoryView } from '@/components/views/HistoryView';

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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  
  const [allMenus, setAllMenus] = useState<WeeklyMenu[]>([]); 
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [dietGoal, setDietGoal] = useState<DietGoal>('balanced');

  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [pendingAction, setPendingAction] = useState<'quick' | 'weekly' | null>(null);

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
    error,
    setError,
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
        setView(ViewState.HOME);
      } else {
        loadUserData(newSession.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const handleGenerateQuick = async () => {
    const recipe = await generateQuick(difficulty);
    if (recipe) {
      setGeneratedRecipe(recipe);
      setView(ViewState.RECIPE_DETAILS);
    }
  };

  const handleGenerateWeekly = async () => {
    const menu = await generateWeekly(dietGoal);
    if (menu) {
      setWeeklyMenu(menu);
      setAllMenus(prev => [menu, ...prev]);
      setView(ViewState.WEEKLY_PLAN);
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!session?.user || !confirm("Deseja apagar este cardápio?")) return;
    try {
      await SupabaseService.deleteWeeklyMenu(menuId, session.user.id);
      const updated = allMenus.filter(m => m.id !== menuId);
      setAllMenus(updated);
      if (weeklyMenu?.id === menuId) setWeeklyMenu(updated[0] || null);
    } catch (e) {
      alert("Falha ao remover cardápio.");
    }
  };

  const currentView = useMemo(() => {
    switch(view) {
      case ViewState.HOME: return <HomeView user={user} weeklyMenu={weeklyMenu} onNavigate={setView} />;
      case ViewState.FRIDGE:
        return (
          <FridgeView 
            ingredients={ingredients}
            onAddIngredient={handleAddIngredients}
            onRemoveIngredient={handleRemoveIngredient}
            onImageUpload={handleImageUpload}
            selectedDifficulty={difficulty}
            setSelectedDifficulty={setDifficulty}
            onGenerateQuick={handleGenerateQuick}
            onGenerateWeekly={handleGenerateWeekly}
            isLoading={isLoading}
            isPremium={user?.isPremium || false}
            error={error}
            onErrorDismiss={() => setError(null)}
          />
        );
      case ViewState.WEEKLY_PLAN:
        return (
          <WeeklyPlanView 
            weeklyMenu={weeklyMenu}
            ingredients={ingredients}
            onAddIngredient={handleAddIngredients}
            onRemoveIngredient={handleRemoveIngredient}
            onImageUpload={handleImageUpload}
            dietGoal={dietGoal}
            setDietGoal={setDietGoal}
            onGenerate={handleGenerateWeekly}
            onNavigate={setView}
            onSelectRecipe={(r) => { setGeneratedRecipe(r); setView(ViewState.RECIPE_DETAILS); }}
            onDeleteMenu={handleDeleteMenu}
            isLoading={isLoading}
            isPremium={user?.isPremium || false}
            error={error}
          />
        );
      case ViewState.SHOPPING_LIST:
        return <ShoppingListView menu={weeklyMenu} onBack={() => setView(ViewState.WEEKLY_PLAN)} />;
      case ViewState.MENU_HISTORY:
        return (
          <HistoryView 
            menus={allMenus} 
            onSelect={(m) => { setWeeklyMenu(m); setView(ViewState.WEEKLY_PLAN); }} 
            onDelete={handleDeleteMenu}
            onBack={() => setView(ViewState.WEEKLY_PLAN)}
          />
        );
      case ViewState.RECIPE_DETAILS: 
        return <RecipeDetailsView recipe={generatedRecipe} isPremium={user?.isPremium || false} onBack={() => setView(ViewState.FRIDGE)} />;
      case ViewState.PROFILE: 
        return <ProfileView 
          user={user} 
          session={session} 
          onLogout={SupabaseService.signOut} 
          onUpdateUser={setUser} 
          onDeleteAccount={SupabaseService.deleteAccount} 
        />;
      default: return <HomeView user={user} weeklyMenu={weeklyMenu} onNavigate={setView} />;
    }
  }, [view, user, weeklyMenu, ingredients, isLoading, error, difficulty, dietGoal, allMenus]);

  if (!session) return <AuthScreen onLogin={() => {}} />;

  return (
    <Layout activeView={view} onNavigate={setView} isPremium={user?.isPremium || false}>
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

      {showLimitModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="text-xl font-bold mb-2">Limite Grátis Atingido</h3>
            <p className="text-gray-500 text-sm mb-6">Para continuar gerando sem limites, escolha uma opção:</p>
            <button onClick={() => { setView(ViewState.PREMIUM); setShowLimitModal(false); }} className="w-full bg-chef-green text-white font-bold py-4 rounded-2xl mb-3">👑 Ver Planos Premium</button>
            <button onClick={() => { setShowLimitModal(false); setIsWatchingAd(true); }} className="w-full bg-gray-100 py-4 rounded-2xl text-sm font-bold text-gray-600">📺 Assistir Anúncio (1 uso)</button>
          </div>
        </div>
      )}
      
      {isWatchingAd && (
        <AdInterstitial onFinish={() => {
          setIsWatchingAd(false);
          if (pendingAction === 'quick') handleGenerateQuick();
          if (pendingAction === 'weekly') handleGenerateWeekly();
        }} />
      )}
    </Layout>
  );
}

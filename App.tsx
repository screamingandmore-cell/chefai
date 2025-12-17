
import React, { useState, useEffect, useCallback } from 'react';
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

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
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
      const profile = await SupabaseService.getUserProfile(userId);
      setUser(profile);
      const menus = await SupabaseService.getWeeklyMenus(userId);
      setAllMenus(menus);
      if (menus.length > 0 && !weeklyMenu) setWeeklyMenu(menus[0]);
    } catch (e) { console.error("Sync error", e); }
  }, [weeklyMenu]);

  const handleProfileRefresh = useCallback(() => {
    if (session?.user) loadUserData(session.user.id);
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
    SupabaseService.getUserSession().then(setSession);
    const { data: { subscription } } = SupabaseService.supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) { setUser(null); setAllMenus([]); setWeeklyMenu(null); }
    });

    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  useEffect(() => { if (session?.user) loadUserData(session.user.id); }, [session, loadUserData]);

  const handleGenerateQuick = async () => {
    if (!isOnline) {
      setError("Sem conexão com a internet.");
      return;
    }
    try {
      const recipe = await generateQuick(difficulty);
      if (recipe) {
        setGeneratedRecipe(recipe);
        setView(ViewState.RECIPE_DETAILS);
      }
    } catch (e: any) {
      if (e.message === "LIMIT_REACHED") { 
        setPendingAction('quick'); 
        setShowLimitModal(true); 
      }
    }
  };

  const handleGenerateWeekly = async () => {
    if (!isOnline) {
      setError("Sem conexão com a internet.");
      return;
    }
    try {
      const menu = await generateWeekly(dietGoal);
      if (menu) {
        setWeeklyMenu(menu);
        setAllMenus(prev => [menu, ...prev]);
        setView(ViewState.WEEKLY_PLAN);
      }
    } catch (e: any) {
      if (e.message === "LIMIT_REACHED") { 
        setPendingAction('weekly'); 
        setShowLimitModal(true); 
      }
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!session?.user || !confirm("Apagar este cardápio?")) return;
    try {
      await SupabaseService.deleteWeeklyMenu(menuId, session.user.id);
      const updated = allMenus.filter(m => m.id !== menuId);
      setAllMenus(updated);
      if (weeklyMenu?.id === menuId) setWeeklyMenu(updated[0] || null);
    } catch (e: any) { alert("Erro ao excluir."); }
  };

  const renderView = () => {
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
          onLogout={() => SupabaseService.signOut()} 
          onUpdateUser={setUser} 
          onDeleteAccount={SupabaseService.deleteAccount} 
        />;
      default: return <HomeView user={user} weeklyMenu={weeklyMenu} onNavigate={setView} />;
    }
  };

  if (!session) return <AuthScreen onLogin={() => {}} />;

  return (
    <Layout activeView={view} onNavigate={setView} isPremium={user?.isPremium || false}>
      {renderView()}
      
      {showLimitModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <h3 className="text-xl font-bold mb-4">Limite Atingido</h3>
            <p className="text-gray-500 mb-6">Assine o Premium ou assista um anúncio para continuar.</p>
            <button onClick={() => setView(ViewState.PREMIUM)} className="w-full bg-yellow-500 text-white font-bold py-3 rounded-xl mb-3">👑 Ver Premium</button>
            <button onClick={() => { setShowLimitModal(false); setIsWatchingAd(true); }} className="w-full bg-gray-100 py-3 rounded-xl text-sm">📺 Assistir Vídeo</button>
            <button onClick={() => setShowLimitModal(false)} className="mt-4 text-xs text-gray-400">Depois</button>
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


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { ViewState, UserProfile, Recipe, WeeklyMenu, Difficulty, DietGoal } from '@/types';
import * as SupabaseService from '@/services/supabase';
import { useChefActions } from '@/services/hooks/useChefActions';
import { Session } from '@supabase/supabase-js';

// Views - Usando Default Imports para evitar erros de resolução de membro
import AuthScreen from '@/components/AuthScreen';
import HomeView from '@/components/views/HomeView';
import FridgeView from '@/components/views/FridgeView';
import QuickRecipeView from '@/components/views/QuickRecipeView';
import WeeklyPlanView from '@/components/views/WeeklyPlanView';
import RecipeDetailsView from '@/components/views/RecipeDetailsView';
import ProfileView from '@/components/views/ProfileView';
import ShoppingListView from '@/components/views/ShoppingListView';
import HistoryView from '@/components/views/HistoryView';
import PremiumView from '@/components/views/PremiumView';
import TermsView from '@/components/views/TermsView';
import PrivacyView from '@/components/views/PrivacyView';

const LOADING_MESSAGES = [
  "Chef está afiando as facas...",
  "Escolhendo os melhores temperos...",
  "Consultando o livro secreto de receitas...",
  "Grelhando as ideias...",
  "Quase pronto! O cheiro está ótimo...",
];

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [viewHistory, setViewHistory] = useState<ViewState[]>([ViewState.HOME]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  
  const [allMenus, setAllMenus] = useState<WeeklyMenu[]>([]); 
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [dietGoal, setDietGoal] = useState<DietGoal>('balanced');
  const [isDeleting, setIsDeleting] = useState(false);

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
    handleUpdateAllergies,
    handleRemoveAllergy,
    handleImageUpload,
    generateQuick,
    generateWeekly
  } = useChefActions(user, session, handleProfileRefresh, setUser);

  const handleDeleteMenu = useCallback(async (menuId: string) => {
    if (!session?.user?.id || isDeleting) return;

    setIsDeleting(true);
    try {
      await SupabaseService.deleteWeeklyMenu(menuId, session.user.id);
      
      setAllMenus(prev => {
        const updated = prev.filter(m => m.id !== menuId);
        if (weeklyMenu?.id === menuId) {
          setWeeklyMenu(updated.length > 0 ? updated[0] : null);
        }
        return updated;
      });
      
    } catch (err) {
      console.error("Erro ao apagar cardápio:", err);
      alert("Erro ao tentar excluir o cardápio do servidor.");
    } finally {
      setIsDeleting(false);
    }
  }, [session, weeklyMenu, isDeleting]);

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
    const recipe = await generateQuick(difficulty, dietGoal);
    if (recipe) {
      setGeneratedRecipe(recipe);
      navigate(ViewState.RECIPE_DETAILS);
    }
  };

  const handleGenerateWeekly = async () => {
    const menu = await generateWeekly(difficulty, dietGoal);
    if (menu) {
      setWeeklyMenu(menu);
      setAllMenus(prev => [menu, ...prev]);
      navigate(ViewState.WEEKLY_PLAN);
    }
  };

  const handleRecipeGenerated = useCallback((r: Recipe) => {
    setGeneratedRecipe(r);
    navigate(ViewState.RECIPE_DETAILS);
  }, [navigate]);

  const currentView = useMemo(() => {
    switch(view) {
      case ViewState.HOME: return <HomeView user={user} weeklyMenu={weeklyMenu} onNavigate={navigate} />;
      case ViewState.PREMIUM: return <PremiumView user={user} onNavigate={navigate} />;
      case ViewState.TERMS: return <TermsView onBack={() => navigate(-1)} />;
      case ViewState.PRIVACY: return <PrivacyView onBack={() => navigate(-1)} />;
      case ViewState.FRIDGE:
        return (
          <FridgeView 
            user={user}
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
            onUpdateAllergies={handleUpdateAllergies}
            onRemoveAllergy={handleRemoveAllergy}
          />
        );
      case ViewState.QUICK_RECIPE:
        return (
          <QuickRecipeView 
            user={user}
            ingredients={ingredients}
            onAddIngredient={handleAddIngredients}
            onRemoveIngredient={handleRemoveIngredient}
            onImageUpload={handleImageUpload}
            selectedDifficulty={difficulty}
            setSelectedDifficulty={setDifficulty}
            dietGoal={dietGoal}
            setDietGoal={setDietGoal}
            onGenerateQuick={handleGenerateQuick}
            onRecipeGenerated={handleRecipeGenerated}
            isLoading={isLoading}
            isPremium={user?.isPremium || false}
            onNavigate={navigate}
            onUpdateAllergies={handleUpdateAllergies}
            onRemoveAllergy={handleRemoveAllergy}
          />
        );
      case ViewState.WEEKLY_PLAN:
        return (
          <WeeklyPlanView 
            weeklyMenu={weeklyMenu}
            onNavigate={navigate}
            onSelectRecipe={(r: Recipe) => { setGeneratedRecipe(r); navigate(ViewState.RECIPE_DETAILS); }}
            onClearMenu={handleDeleteMenu} 
            dietGoal={dietGoal}
            setDietGoal={setDietGoal}
            selectedDifficulty={difficulty}
            setSelectedDifficulty={setDifficulty}
            onGenerateWeekly={handleGenerateWeekly}
            isLoading={isLoading || isDeleting}
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
          onSelect={(m: WeeklyMenu) => { setWeeklyMenu(m); navigate(ViewState.WEEKLY_PLAN); }}
          onDelete={handleDeleteMenu}
          onBack={() => navigate(-1)}
        />;
      default: return <HomeView user={user} weeklyMenu={weeklyMenu} onNavigate={navigate} />;
    }
  }, [view, user, weeklyMenu, allMenus, ingredients, isLoading, difficulty, dietGoal, session, handleAddIngredients, handleRemoveIngredient, handleImageUpload, handleGenerateQuick, handleGenerateWeekly, handleUpdateAllergies, handleRemoveAllergy, handleDeleteMenu, isDeleting, navigate, handleRecipeGenerated]);

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

      {isDeleting && (
        <div className="fixed inset-0 z-[301] bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl shadow-xl flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-black text-gray-800 uppercase tracking-widest">Apagando Cardápio...</p>
          </div>
        </div>
      )}
    </Layout>
  );
}

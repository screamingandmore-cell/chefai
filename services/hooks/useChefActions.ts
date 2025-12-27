import { useState, useCallback, useEffect } from 'react';
import { Recipe, WeeklyMenu, Difficulty, DietGoal, UserProfile } from '@/types';
import * as AIService from '@/services/ai'; 
import * as SupabaseService from '@/services/supabase';
import { compressImage } from '@/utils/image';
import { Session } from '@supabase/supabase-js';

export interface ChefActionsReturn {
  ingredients: string[];
  isLoading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
  handleAddIngredients: (newItems: string[]) => void;
  handleRemoveIngredient: (index: number) => void;
  handleUpdateAllergies: (rawInput: string) => Promise<void>;
  handleRemoveAllergy: (index: number) => Promise<void>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, autoGenerateParams?: { difficulty: Difficulty, goal: DietGoal }) => Promise<Recipe | null>;
  generateQuick: (difficulty: Difficulty, goal: DietGoal, customIngredients?: string[]) => Promise<Recipe | null>;
  generateWeekly: (difficulty: Difficulty, goal: DietGoal) => Promise<WeeklyMenu | null>;
}

export function useChefActions(
  user: UserProfile | null, 
  session: Session | null, 
  onProfileRefresh: () => void,
  onUpdateUser: (u: UserProfile | null) => void
): ChefActionsReturn {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      const saved = localStorage.getItem(`chef_ai_ingredients_${session.user.id}`);
      if (saved) {
        try {
          setIngredients(JSON.parse(saved));
        } catch (e) {
          setIngredients([]);
        }
      }
    }
  }, [session]);

  useEffect(() => {
    if (session?.user?.id) {
      localStorage.setItem(`chef_ai_ingredients_${session.user.id}`, JSON.stringify(ingredients));
    }
  }, [ingredients, session]);

  const handleAddIngredients = useCallback((newItems: string[]) => {
    setIngredients(prev => {
      const combined = [...new Set([...prev, ...newItems])];
      return combined.slice(0, 50);
    });
  }, []);

  const handleRemoveIngredient = useCallback((index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateAllergies = useCallback(async (rawInput: string) => {
    if (!user || !session?.user) return;
    
    const items = rawInput.split(/,|\n|;/).map(i => i.trim()).filter(i => i.length > 0 && i.length <= 500);
    const uniqueNew = items.filter(i => !user.allergies.includes(i));
    
    if (uniqueNew.length === 0) return;

    const updatedAllergies = [...user.allergies, ...uniqueNew];
    const updatedUser = { ...user, allergies: updatedAllergies };
    
    onUpdateUser(updatedUser);
    try {
      await SupabaseService.updatePreferences(session.user.id, updatedAllergies);
    } catch (err) {
      console.error("Erro ao salvar preferências:", err);
    }
  }, [user, session, onUpdateUser]);

  const handleRemoveAllergy = useCallback(async (index: number) => {
    if (!user || !session?.user) return;
    const updatedAllergies = user.allergies.filter((_, i) => i !== index);
    const updatedUser = { ...user, allergies: updatedAllergies };
    onUpdateUser(updatedUser);
    try {
      await SupabaseService.updatePreferences(session.user.id, updatedAllergies);
    } catch (err) {
      console.error("Erro ao remover preferência:", err);
    }
  }, [user, session, onUpdateUser]);

  const generateQuick = useCallback(async (difficulty: Difficulty, goal: DietGoal, customIngredients?: string[]): Promise<Recipe | null> => {
    const activeIngredients = customIngredients || ingredients;
    if (activeIngredients.length === 0) {
      alert("Adicione ingredientes primeiro.");
      return null;
    }

    setIsLoading(true);
    try {
      const recipe = await AIService.generateQuickRecipe(activeIngredients, user?.allergies || [], difficulty, goal);
      onProfileRefresh();
      return recipe;
    } catch (err) {
      console.error("Erro IA:", err);
      alert("Erro ao criar receita. Tente novamente.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [ingredients, user, onProfileRefresh]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, autoGenerateParams?: { difficulty: Difficulty, goal: DietGoal }): Promise<Recipe | null> => {
    const files = e.target.files;
    if (!files || files.length === 0) return null;
    
    if (!user || !user.isPremium) {
      alert("Recurso Premium: Assine para usar a câmera.");
      return null;
    }

    setIsLoading(true);
    try {
      const imagesBase64: string[] = [];
      for (let i = 0; i < Math.min(files.length, 3); i++) {
        const base64 = await compressImage(files[i]);
        imagesBase64.push(base64);
      }
      const detected = await AIService.analyzeFridgeImage(imagesBase64);
      handleAddIngredients(detected);

      if (autoGenerateParams && detected.length > 0) {
        const combined = [...new Set([...ingredients, ...detected])];
        const recipe = await AIService.generateQuickRecipe(combined, user?.allergies || [], autoGenerateParams.difficulty, autoGenerateParams.goal);
        return recipe;
      }
      
      return null;
    } catch (err) {
      console.error("Erro na imagem:", err);
      alert("Erro ao analisar imagem.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, handleAddIngredients, ingredients]);

  const generateWeekly = useCallback(async (difficulty: Difficulty, goal: DietGoal): Promise<WeeklyMenu | null> => {
    if (!session?.user?.id) return null;
    if (ingredients.length === 0) {
      alert("Adicione ingredientes primeiro.");
      return null;
    }

    setIsLoading(true);
    try {
      const tempMenu = await AIService.generateWeeklyMenu(ingredients, user?.allergies || [], goal, difficulty);
      const savedMenu = await SupabaseService.saveWeeklyMenu(session.user.id, tempMenu);
      onProfileRefresh();
      return savedMenu;
    } catch (err) {
      console.error("Erro Cardápio:", err);
      alert("Não foi possível planejar sua semana.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [ingredients, user, session, onProfileRefresh]);

  return {
    ingredients,
    isLoading,
    error,
    setError,
    handleAddIngredients,
    handleRemoveIngredient,
    handleUpdateAllergies,
    handleRemoveAllergy,
    handleImageUpload,
    generateQuick,
    generateWeekly
  };
}
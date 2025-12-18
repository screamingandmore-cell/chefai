
import { useState, useCallback, useEffect } from 'react';
import { Recipe, WeeklyMenu, Difficulty, DietGoal, UserProfile } from '@/types';
import * as AIService from '@/services/ai'; 
import * as SupabaseService from '@/services/supabase';
import { compressImage } from '@/utils/image';

export function useChefActions(user: UserProfile | null, session: any, onProfileRefresh: () => void) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      const saved = localStorage.getItem(`chef_ai_ingredients_${session.user.id}`);
      if (saved) setIngredients(JSON.parse(saved));
    } else {
      setIngredients([]);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user?.id && ingredients.length > 0) {
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (!user || !user.isPremium) {
      setError("Assine o Premium para usar a câmera.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const imagesBase64: string[] = [];
      for (let i = 0; i < Math.min(files.length, 3); i++) {
        const base64 = await compressImage(files[i]);
        imagesBase64.push(base64);
      }
      const detected = await AIService.analyzeFridgeImage(imagesBase64);
      handleAddIngredients(detected);
    } catch (err: any) {
      setError("Erro ao ler foto.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuick = async (difficulty: Difficulty, goal: DietGoal): Promise<Recipe | null> => {
    if (!session?.user || ingredients.length === 0) return null;
    setIsLoading(true);
    setError(null);
    try {
      const recipe = await AIService.generateQuickRecipe(ingredients, user?.allergies || [], difficulty, goal);
      onProfileRefresh();
      return recipe;
    } catch (err: any) {
      setError("Erro ao gerar receita.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateWeekly = async (goal: DietGoal): Promise<WeeklyMenu | null> => {
    if (!session?.user || ingredients.length === 0) return null;
    setIsLoading(true);
    setError(null);
    try {
      const tempMenu = await AIService.generateWeeklyMenu(ingredients, user?.allergies || [], goal);
      const savedMenu = await SupabaseService.saveWeeklyMenu(session.user.id, tempMenu);
      onProfileRefresh();
      return savedMenu;
    } catch (err: any) {
      console.error(err);
      setError("Erro ao criar cardápio. Tente com menos ingredientes.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    ingredients,
    isLoading,
    error,
    setError,
    handleAddIngredients,
    handleRemoveIngredient,
    handleImageUpload,
    generateQuick,
    generateWeekly
  };
}

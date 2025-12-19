
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (!user || !user.isPremium) {
      alert("Assine o Premium para usar a câmera.");
      return;
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
    } catch (err: any) {
      console.error("Erro na imagem:", err);
      alert("O Chef teve um problema ao analisar as fotos. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuick = async (difficulty: Difficulty, goal: DietGoal): Promise<Recipe | null> => {
    if (ingredients.length === 0) {
      alert("Adicione ingredientes primeiro.");
      return null;
    }

    setIsLoading(true);
    try {
      const recipe = await AIService.generateQuickRecipe(ingredients, user?.allergies || [], difficulty, goal);
      
      if (recipe.error) {
        alert(`Ei! Isso não parece comida: ${recipe.error}`);
        return null;
      }

      onProfileRefresh();
      return recipe;
    } catch (err: any) {
      console.error("Erro IA:", err);
      alert("O Chef teve um problema ao criar a receita. Tente novamente.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateWeekly = async (difficulty: Difficulty, goal: DietGoal): Promise<WeeklyMenu | null> => {
    if (ingredients.length === 0) {
      alert("Adicione ingredientes primeiro.");
      return null;
    }

    setIsLoading(true);
    try {
      const tempMenu = await AIService.generateWeeklyMenu(ingredients, user?.allergies || [], goal, difficulty);
      
      if (tempMenu.days?.[0]?.lunch?.error) {
        alert("Itens não comestíveis detectados em uma das receitas.");
        return null;
      }

      const savedMenu = await SupabaseService.saveWeeklyMenu(session.user.id, tempMenu);
      onProfileRefresh();
      return savedMenu;
    } catch (err: any) {
      console.error("Erro Cardápio:", err);
      alert("Não foi possível planejar sua semana. Verifique sua conexão.");
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

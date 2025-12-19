
import { useState, useCallback, useEffect } from 'react';
import { Recipe, WeeklyMenu, Difficulty, DietGoal, UserProfile } from '@/types';
import * as AIService from '@/services/ai'; 
import * as SupabaseService from '@/services/supabase';
import { compressImage } from '@/utils/image';

export function useChefActions(user: UserProfile | null, session: any, onProfileRefresh: () => void) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar ingredientes iniciais do localStorage ao iniciar sessão
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
    } else {
      setIngredients([]);
    }
  }, [session]);

  // Salvar ingredientes no localStorage sempre que a lista mudar
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
      console.error("Erro no upload de imagem:", err);
      setError("Erro ao ler foto.");
      alert("Houve um problema ao processar a imagem. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuick = async (difficulty: Difficulty, goal: DietGoal): Promise<Recipe | null> => {
    if (!session?.user) {
      alert("Sessão inválida. Por favor, faça login novamente.");
      return null;
    }
    if (ingredients.length === 0) {
      alert("Adicione pelo menos um ingrediente antes de gerar.");
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log("Gerando receita rápida com:", ingredients, difficulty, goal);
      const recipe = await AIService.generateQuickRecipe(ingredients, user?.allergies || [], difficulty, goal);
      
      if (recipe.error) {
        setError(recipe.error);
        alert(`Ei! Isso não parece comida. ${recipe.error}`);
        return null;
      }

      onProfileRefresh();
      return recipe;
    } catch (err: any) {
      console.error("Erro ao gerar receita rápida:", err);
      setError("Erro ao gerar receita.");
      alert(`Ocorreu um erro na IA: ${err.message || 'Erro desconhecido'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateWeekly = async (difficulty: Difficulty, goal: DietGoal): Promise<WeeklyMenu | null> => {
    if (!session?.user) {
      alert("Sessão inválida.");
      return null;
    }
    if (ingredients.length === 0) {
      alert("Adicione ingredientes primeiro.");
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log("Gerando cardápio semanal com:", ingredients, difficulty, goal);
      const tempMenu = await AIService.generateWeeklyMenu(ingredients, user?.allergies || [], goal, difficulty);
      
      // Verifica segurança em todas as refeições do cardápio
      for (const day of tempMenu.days) {
        if (day.lunch.error || day.dinner.error) {
          const errMsg = day.lunch.error || day.dinner.error;
          setError(errMsg || "Ingredientes inválidos");
          alert("O Chef detectou itens não comestíveis em sua geladeira. Por favor, limpe sua lista.");
          return null;
        }
      }

      const savedMenu = await SupabaseService.saveWeeklyMenu(session.user.id, tempMenu);
      onProfileRefresh();
      return savedMenu;
    } catch (err: any) {
      console.error("Erro ao criar cardápio:", err);
      setError("Erro ao criar cardápio.");
      alert(`Erro ao planejar semana: ${err.message || 'Tente com menos ingredientes.'}`);
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

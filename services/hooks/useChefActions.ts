
import React, { useState, useCallback, useEffect } from 'react';
import { Recipe, WeeklyMenu, Difficulty, DietGoal, UserProfile } from '@/types';
import * as OpenAIService from '@/services/openai';
import * as SupabaseService from '@/services/supabase';
import { compressImage } from '@/utils/image';

export function useChefActions(user: UserProfile | null, session: any, onProfileRefresh: () => void) {
  // Inicializa com dados do localStorage se existirem
  const [ingredients, setIngredients] = useState<string[]>(() => {
    const saved = localStorage.getItem('chef_ai_temp_ingredients');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persiste ingredientes sempre que mudarem
  useEffect(() => {
    localStorage.setItem('chef_ai_temp_ingredients', JSON.stringify(ingredients));
  }, [ingredients]);

  const handleAddIngredients = useCallback((newItems: string[]) => {
    setIngredients(prev => [...new Set([...prev, ...newItems])]);
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
      for (let i = 0; i < Math.min(files.length, 6); i++) {
        const base64 = await compressImage(files[i]);
        imagesBase64.push(base64);
      }
      const detected = await OpenAIService.analyzeFridgeImage(imagesBase64);
      handleAddIngredients(detected);
    } catch (err: any) {
      setError("Falha ao analisar imagem. Tente listar manualmente.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuick = async (difficulty: Difficulty): Promise<Recipe | null> => {
    if (!user || !session?.user || ingredients.length === 0) return null;
    if (!navigator.onLine) {
      setError("Você está sem internet.");
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const recipe = await OpenAIService.generateQuickRecipe(ingredients, user.allergies, difficulty);
      onProfileRefresh();
      return recipe;
    } catch (err: any) {
      if (err.message === "LIMIT_REACHED") throw err;
      setError(err.message || "Erro ao gerar receita.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateWeekly = async (goal: DietGoal): Promise<WeeklyMenu | null> => {
    if (!user || !session?.user || ingredients.length === 0) return null;
    if (!navigator.onLine) {
      setError("Você está sem internet.");
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const menu = await OpenAIService.generateWeeklyMenu(ingredients, user.allergies, goal);
      await SupabaseService.saveWeeklyMenu(session.user.id, menu);
      onProfileRefresh();
      return menu;
    } catch (err: any) {
      if (err.message === "LIMIT_REACHED") throw err;
      setError(err.message || "Erro ao gerar cardápio.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    ingredients,
    setIngredients,
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

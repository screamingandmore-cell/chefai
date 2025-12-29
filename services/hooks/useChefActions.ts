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
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<Recipe | null>;
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
        try { setIngredients(JSON.parse(saved)); } catch (e) { setIngredients([]); }
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
      const combined = [...new Set([...prev, ...newItems.map(i => i.toLowerCase())])];
      return combined.slice(0, 50);
    });
  }, []);

  const handleRemoveIngredient = useCallback((index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateAllergies = useCallback(async (rawInput: string) => {
    if (!user || !session?.user) return;
    const items = rawInput.split(/,|\n|;/).map(i => i.trim()).filter(i => i.length > 0);
    const updatedAllergies = [...new Set([...user.allergies, ...items])];
    onUpdateUser({ ...user, allergies: updatedAllergies });
    try { await SupabaseService.updatePreferences(session.user.id, updatedAllergies); } catch (err) { console.error(err); }
  }, [user, session, onUpdateUser]);

  const handleRemoveAllergy = useCallback(async (index: number) => {
    if (!user || !session?.user) return;
    const updatedAllergies = user.allergies.filter((_, i) => i !== index);
    onUpdateUser({ ...user, allergies: updatedAllergies });
    try { await SupabaseService.updatePreferences(session.user.id, updatedAllergies); } catch (err) { console.error(err); }
  }, [user, session, onUpdateUser]);

  const generateQuick = useCallback(async (difficulty: Difficulty, goal: DietGoal): Promise<Recipe | null> => {
    if (ingredients.length === 0) {
      alert("Adicione ingredientes primeiro.");
      return null;
    }
    setIsLoading(true);
    try {
      const recipe = await AIService.generateQuickRecipe(ingredients, user?.allergies || [], difficulty, goal);
      onProfileRefresh();
      return recipe;
    } catch (err) {
      console.error(err);
      alert("O Chef teve um problema. Tente novamente.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [ingredients, user, onProfileRefresh]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>): Promise<Recipe | null> => {
    const files = e.target.files;
    if (!files || files.length === 0) return null;
    if (!user?.isPremium) {
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
      return null; // Retornamos null para NÃO mudar de tela automaticamente
    } catch (err) {
      console.error(err);
      alert("Erro ao ler imagem.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, handleAddIngredients]);

  const generateWeekly = useCallback(async (difficulty: Difficulty, goal: DietGoal): Promise<WeeklyMenu | null> => {
    if (!session?.user?.id || ingredients.length === 0) return null;
    setIsLoading(true);
    try {
      const menu = await AIService.generateWeeklyMenu(ingredients, user?.allergies || [], goal, difficulty);
      const saved = await SupabaseService.saveWeeklyMenu(session.user.id, menu);
      onProfileRefresh();
      return saved;
    } catch (err) {
      console.error(err);
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
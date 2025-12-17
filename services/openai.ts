
import { WeeklyMenu, Recipe, Difficulty, DietGoal } from "../types";
import { supabase } from "./supabase";

/**
 * Função centralizada para chamar a lógica de IA no Back-end (Supabase Edge Function)
 */
async function invokeChefApi(payload: any) {
  const { data, error } = await supabase.functions.invoke('chef-api', {
    body: payload
  });

  if (error) {
    throw new Error(error.message || "Erro na comunicação com o servidor.");
  }

  if (data?.error === "SERVER_TIMEOUT") {
    throw new Error(data.message);
  }

  return data;
}

export const generateQuickRecipe = async (
  ingredients: string[], 
  allergies: string[], 
  difficulty: Difficulty
): Promise<Recipe> => {
  return await invokeChefApi({
    action: 'generate-quick-recipe',
    ingredients,
    allergies,
    difficulty
  });
};

export const generateWeeklyMenu = async (
  ingredients: string[], 
  allergies: string[],
  dietGoal: DietGoal = 'balanced'
): Promise<WeeklyMenu> => {
  const result = await invokeChefApi({
    action: 'generate-weekly-menu',
    ingredients,
    allergies,
    dietGoal
  });

  return {
    ...result,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    goal: dietGoal
  };
};

export const analyzeFridgeImage = async (images: string | string[]): Promise<string[]> => {
  const imageArray = Array.isArray(images) ? images : [images];
  const result = await invokeChefApi({
    action: 'analyze-fridge',
    images: imageArray
  });
  return result.ingredients || [];
};

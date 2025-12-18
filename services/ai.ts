
import { WeeklyMenu, Recipe, Difficulty, DietGoal } from "../types";
import { supabase } from "./supabase";

async function invokeChefApi(payload: any) {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const { data, error } = await supabase.functions.invoke('chef-api', {
    body: payload,
    headers: {
      'apikey': anonKey || ''
    }
  });

  if (error) {
    console.error("Erro na Edge Function Chef.ai:", error);
    throw new Error("O Chef está ocupado ou sem internet. Tente novamente em instantes.");
  }

  if (data?.error === "TIMEOUT") {
    throw new Error("A IA demorou muito para responder. Tente com menos ingredientes.");
  }
  
  if (data?.error) {
    throw new Error(data.message || "Não consegui criar essa receita. Tente mudar os ingredientes.");
  }

  return data;
}

export const generateQuickRecipe = async (
  ingredients: string[], 
  allergies: string[], 
  difficulty: Difficulty
): Promise<Recipe> => {
  const result = await invokeChefApi({
    action: 'generate-quick-recipe',
    ingredients,
    allergies,
    difficulty
  });
  
  return { 
    ...result, 
    id: crypto.randomUUID() 
  };
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
    shoppingList: result.shoppingList || [],
    days: result.days || [],
    id: '', 
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

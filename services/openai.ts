
import { WeeklyMenu, Recipe, Difficulty, DietGoal } from "../types";
import { supabase } from "./supabase";

/**
 * Invoca a Supabase Edge Function que contém a lógica da OpenAI (gpt-4o-mini).
 * Otimizado para instruções concisas e geração rápida.
 */
async function invokeChefApi(payload: any) {
  const { data, error } = await supabase.functions.invoke('chef-api', {
    body: payload
  });

  if (error) throw new Error(error.message || "Erro de conexão com o servidor.");
  
  if (data?.error === "TIMEOUT") {
    throw new Error("A IA demorou muito para responder. Tente com menos ingredientes.");
  }
  
  if (data?.error) throw new Error(data.message || "Erro no processamento da receita.");

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

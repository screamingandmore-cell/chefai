
import { WeeklyMenu, Recipe, Difficulty, DietGoal } from "../types";
import { supabase } from "./supabase";

/**
 * Invoca a Edge Function que agora utiliza Gemini 3 Flash.
 * Envia explicitamente a apikey caso o cliente precise de reforço.
 */
async function invokeChefApi(payload: any) {
  // Verificação local antes de tentar a rede
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const { data, error } = await supabase.functions.invoke('chef-api', {
    body: payload,
    headers: {
      'apikey': anonKey || ''
    }
  });

  if (error) {
    console.error("Erro na Edge Function:", error);
    throw new Error(error.message || "Erro de conexão com o Chef.ai");
  }

  if (data?.error === "TIMEOUT") {
    throw new Error("A IA demorou muito para responder. Tente com menos ingredientes.");
  }
  
  if (data?.error) {
    throw new Error(data.message || "Erro no processamento da receita.");
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

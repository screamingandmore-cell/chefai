
import { WeeklyMenu, Recipe, Difficulty, DietGoal } from "../types";
import { supabase } from "./supabase";

/**
 * Gera um ID apenas para objetos locais (Receitas rápidas que não vão pro banco).
 */
const generateLocalId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (e) {}
  return `local_${Date.now()}`;
};

async function invokeChefApi(payload: any) {
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
    id: generateLocalId() 
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

  // Não geramos ID aqui; o saveWeeklyMenu retornará o ID do banco
  const newMenu: WeeklyMenu = {
    shoppingList: result.shoppingList || [],
    days: result.days || [],
    id: '', 
    createdAt: new Date().toISOString(),
    goal: dietGoal
  };

  return newMenu;
};

export const analyzeFridgeImage = async (images: string | string[]): Promise<string[]> => {
  const imageArray = Array.isArray(images) ? images : [images];
  const result = await invokeChefApi({
    action: 'analyze-fridge',
    images: imageArray
  });
  
  return result.ingredients || [];
};

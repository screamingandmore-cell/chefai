
import { WeeklyMenu, Recipe, Difficulty, DietGoal } from "../types";
import { supabase } from "./supabase";

/**
 * Gerador de ID robusto com fallback para ambientes não-seguros (sem HTTPS/localhost)
 */
const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }
};

/**
 * Invoca a Edge Function que utiliza Gemini 3 Flash.
 */
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
  
  // Garantimos que o ID do sistema venha POR ÚLTIMO para sobrescrever qualquer id nulo da IA
  return { 
    ...result, 
    id: generateId() 
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

  // Construção robusta do objeto WeeklyMenu
  const newMenu: WeeklyMenu = {
    shoppingList: result.shoppingList || [],
    days: result.days || [],
    id: generateId(),
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

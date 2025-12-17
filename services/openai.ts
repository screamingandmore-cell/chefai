
import { supabase } from './supabase';
import { WeeklyMenu, Recipe, Difficulty, DietGoal } from "../types";

async function invokeChefAPI<T>(action: string, payload: any): Promise<T> {
  const timeoutMs = 35000; // 35 segundos para cobrir gerações pesadas de IA
  
  const fetchPromise = supabase.functions.invoke('chef-api', {
    body: { action, ...payload }
  });

  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("TIMEOUT")), timeoutMs)
  );

  try {
    // @ts-ignore
    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      console.error(`Erro na função ${action}:`, error);
      
      if (error.context) {
        try {
          const errorBody = await error.context.json();
          if (errorBody.error === "LIMIT_REACHED") {
            throw new Error("LIMIT_REACHED");
          }
          throw new Error(errorBody.error || "Erro no processamento.");
        } catch (e: any) {
          if (e.message === "LIMIT_REACHED") throw e;
          throw new Error("Falha na resposta do servidor.");
        }
      }
      throw new Error(error.message || "Erro de conexão.");
    }

    return data as T;
  } catch (err: any) {
    if (err.message === "TIMEOUT") {
      throw new Error("O servidor demorou muito para responder. Tente novamente em instantes.");
    }
    throw err;
  }
}

export const analyzeFridgeImage = async (images: string | string[]): Promise<string[]> => {
  return invokeChefAPI<string[]>('analyze-fridge', {
    images: Array.isArray(images) ? images : [images]
  });
};

export const generateQuickRecipe = async (
  ingredients: string[], 
  allergies: string[], 
  difficulty: Difficulty
): Promise<Recipe> => {
  return invokeChefAPI<Recipe>('generate-quick-recipe', {
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
  return invokeChefAPI<WeeklyMenu>('generate-weekly-menu', {
    ingredients,
    allergies,
    dietGoal
  });
};

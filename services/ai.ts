import { GoogleGenAI, Type } from "@google/genai";
import { WeeklyMenu, Recipe, Difficulty, DietGoal, DIET_GOALS } from "../types";

// Modelo recomendado para performance e custo
const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Padrão de Inicialização Vite:
 * Em produção, o Vite substitui import.meta.env.VITE_GEMINI_API_KEY pelo valor real.
 */
const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY não configurada no ambiente.");
  }
  return new GoogleGenAI({ apiKey });
};

const RECIPE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
    instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
    prepTime: { type: Type.STRING },
    difficulty: { type: Type.STRING },
    calories: { type: Type.NUMBER },
    chefTip: { type: Type.STRING },
    macros: {
      type: Type.OBJECT,
      properties: {
        protein: { type: Type.STRING },
        carbs: { type: Type.STRING },
        fat: { type: Type.STRING }
      },
      required: ["protein", "carbs", "fat"]
    }
  },
  required: ["title", "description", "ingredients", "instructions", "prepTime", "difficulty"]
};

export const analyzeFridgeImage = async (imagesBase64: string[]): Promise<string[]> => {
  try {
    const ai = getAiClient();
    
    const imageParts = imagesBase64.map(base64 => ({
      inlineData: {
        data: base64.includes(',') ? base64.split(',')[1] : base64,
        mimeType: "image/jpeg"
      }
    }));

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { 
        parts: [
          ...imageParts,
          { text: "Identifique todos os alimentos presentes nestas fotos. Retorne os nomes dos ingredientes EXCLUSIVAMENTE em Português do Brasil. Responda apenas com um JSON contendo uma lista chamada 'ingredients'." }
        ] 
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["ingredients"]
        }
      }
    });

    const data = JSON.parse(response.text || '{"ingredients": []}');
    return data.ingredients || [];
  } catch (error: any) {
    console.error("Erro na análise visual:", error);
    throw error;
  }
};

export const generateQuickRecipe = async (
  ingredients: string[], 
  allergies: string[], 
  difficulty: Difficulty,
  goal: DietGoal
): Promise<Recipe> => {
  try {
    const ai = getAiClient();
    const prompt = `Crie uma receita ${difficulty} para objetivo ${DIET_GOALS[goal]} usando: ${ingredients.join(", ")}. Sem usar: ${allergies.join(", ")}.`;
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: "Você é um Chef de Cozinha Brasileiro. Responda apenas em JSON. Todos os campos e textos (título, instruções, etc) devem estar em Português do Brasil.",
        responseMimeType: "application/json",
        responseSchema: RECIPE_SCHEMA
      }
    });

    return { ...JSON.parse(response.text || '{}'), id: crypto.randomUUID() };
  } catch (error: any) {
    console.error("Erro ao gerar receita rápida:", error);
    throw error;
  }
};

export const generateWeeklyMenu = async (
  ingredients: string[], 
  allergies: string[],
  dietGoal: DietGoal,
  difficulty: Difficulty
): Promise<WeeklyMenu> => {
  try {
    const ai = getAiClient();
    const prompt = `Planeje um cardápio de 7 dias (${DIET_GOALS[dietGoal]}) focado nos ingredientes: ${ingredients.join(", ")}. Restrições: ${allergies.join(", ")}.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: "Planejador Gastronômico Profissional. Responda apenas em JSON. É obrigatório que todo o conteúdo (dias, receitas e listas) esteja em Português do Brasil.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shoppingList: { type: Type.ARRAY, items: { type: Type.STRING } },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  lunch: RECIPE_SCHEMA,
                  dinner: RECIPE_SCHEMA
                },
                required: ["day", "lunch", "dinner"]
              }
            }
          },
          required: ["shoppingList", "days"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    return { 
      ...data, 
      id: crypto.randomUUID(), 
      createdAt: new Date().toISOString(), 
      goal: dietGoal 
    };
  } catch (error: any) {
    console.error("Erro ao gerar cardápio semanal:", error);
    throw error;
  }
};
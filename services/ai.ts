import { GoogleGenAI, Type } from "@google/genai";
import { WeeklyMenu, Recipe, Difficulty, DietGoal } from "../types";

// Inicializa o cliente Gemini usando a chave de ambiente pre-configurada
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const RECIPE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Título criativo da receita" },
    description: { type: Type.STRING, description: "Breve descrição apetitosa" },
    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
    instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
    prepTime: { type: Type.STRING, description: "Tempo total, ex: 25 min" },
    difficulty: { type: Type.STRING },
    calories: { type: Type.NUMBER },
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

export const generateQuickRecipe = async (
  ingredients: string[], 
  allergies: string[], 
  difficulty: Difficulty
): Promise<Recipe> => {
  const prompt = `Gere uma receita deliciosa com estes ingredientes: ${ingredients.join(', ')}. 
                  Restrições alimentares: ${allergies.length > 0 ? allergies.join(', ') : 'Nenhuma'}. 
                  Dificuldade: ${difficulty}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "Você é o Chef.ai, um assistente gastronômico de elite. Retorne APENAS o JSON da receita seguindo o esquema rigorosamente.",
      responseMimeType: "application/json",
      responseSchema: RECIPE_SCHEMA
    },
  });

  const recipeData = JSON.parse(response.text || "{}");
  return { 
    ...recipeData, 
    id: crypto.randomUUID() 
  };
};

export const generateWeeklyMenu = async (
  ingredients: string[], 
  allergies: string[],
  dietGoal: DietGoal = 'balanced'
): Promise<WeeklyMenu> => {
  const prompt = `Crie um cardápio semanal completo (7 dias, almoço e jantar) focado em: ${dietGoal}. 
                  Use estes ingredientes base: ${ingredients.join(', ')}. 
                  RESTRIÇÕES CRÍTICAS (NÃO USAR): ${allergies.join(', ')}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "Você é o Nutricionista-Chefe do Chef.ai. Planeje 7 dias balanceados. Retorne JSON.",
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
    },
  });

  const menuData = JSON.parse(response.text || "{}");
  return {
    ...menuData,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    goal: dietGoal
  };
};

export const analyzeFridgeImage = async (images: string | string[]): Promise<string[]> => {
  const imageArray = Array.isArray(images) ? images : [images];
  
  // Estrutura de partes garantindo que o TS reconheça os tipos inlineData e text
  const parts: any[] = [
    ...imageArray.map(base64 => ({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64.split(',')[1] || base64
      }
    })),
    { text: "Analise as fotos e extraia uma lista de todos os ingredientes comestíveis visíveis. Retorne em formato JSON com a chave 'ingredients'." }
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["ingredients"]
      }
    },
  });

  const data = JSON.parse(response.text || "{}");
  return data.ingredients || [];
};

import { GoogleGenAI, Type } from "@google/genai";
import { WeeklyMenu, Recipe, Difficulty, DietGoal } from "../types";

// Recipe JSON schema for model constraints
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
  // Always use a new instance with a cast to string for the API_KEY to satisfy TypeScript
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  try {
    const parts = [
      ...imagesBase64.map(base64 => ({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64.includes(',') ? base64.split(',')[1] : base64
        }
      })),
      { text: "Liste apenas os nomes dos ingredientes visíveis nestas fotos em um array JSON." }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
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

    // Fix: provide fallback for string | undefined
    const data = JSON.parse(response.text || "{}");
    return data.ingredients || [];
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw new Error("Erro ao analisar imagem.");
  }
};

export const generateQuickRecipe = async (
  ingredients: string[], 
  allergies: string[], 
  difficulty: Difficulty,
  goal: DietGoal
): Promise<Recipe> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const prompt = `Crie 1 receita ${goal} usando: ${ingredients.join(", ")}. NÃO USE: ${allergies.join(", ")}. Dificuldade: ${difficulty}.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "Você é o Chef.ai. Crie receitas práticas. Retorne JSON.",
      responseMimeType: "application/json",
      responseSchema: RECIPE_SCHEMA
    }
  });

  // Fix: provide fallback for string | undefined
  const text = response.text || "{}";
  return { ...JSON.parse(text), id: crypto.randomUUID() };
};

export const generateWeeklyMenu = async (
  ingredients: string[], 
  allergies: string[],
  dietGoal: DietGoal
): Promise<WeeklyMenu> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const prompt = `Gere um cardápio semanal completo (7 dias, almoço e jantar) focado no objetivo: ${dietGoal}. 
                  Ingredientes que eu tenho: ${ingredients.join(", ")}. 
                  Evite estes ingredientes: ${allergies.join(", ")}.
                  Use os ingredientes que eu tenho como base, mas pode sugerir outros para completar as receitas.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "Você é um Chef e Nutricionista. Gere 14 refeições variadas. Seja extremamente preciso e conciso para não exceder limites. Retorne JSON estruturado com shoppingList e days.",
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

  // Fix: provide fallback for string | undefined
  const text = response.text || "{}";
  const menuData = JSON.parse(text);
  
  if (!menuData.days || !Array.isArray(menuData.days)) {
    throw new Error("Resposta do modelo inválida para o cardápio semanal.");
  }

  return {
    ...menuData,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    goal: dietGoal
  };
};

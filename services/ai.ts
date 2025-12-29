
import { GoogleGenAI, Type } from "@google/genai";
import { WeeklyMenu, Recipe, Difficulty, DietGoal, DIET_GOALS } from "../types";

// Modelos da série 3 Flash: Mais rápidos, estáveis e com maior limite de cota gratuita
const MODEL_TEXT = 'gemini-3-flash-preview';
const MODEL_VISION = 'gemini-3-flash-preview';

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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const imageParts = imagesBase64.map(base64 => ({
      inlineData: {
        data: base64.includes(',') ? base64.split(',')[1] : base64,
        mimeType: "image/jpeg"
      }
    }));

    const response = await ai.models.generateContent({
      model: MODEL_VISION,
      contents: { 
        parts: [
          ...imageParts,
          { text: "Analise a imagem e identifique todos os ingredientes e alimentos presentes. Retorne os nomes dos ingredientes EXCLUSIVAMENTE em Português do Brasil (PT-BR). Retorne apenas um JSON com a lista 'ingredients'." }
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
    handleAIError(error);
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Crie uma receita ${difficulty} para objetivo ${DIET_GOALS[goal]} usando: ${ingredients.join(", ")}. Sem usar: ${allergies.join(", ")}.`;
    
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: {
        systemInstruction: "Você é um Chef Executivo. Responda apenas em JSON (PT-BR). Certifique-se de que todos os textos gerados estejam em Português.",
        responseMimeType: "application/json",
        responseSchema: RECIPE_SCHEMA
      }
    });

    return { ...JSON.parse(response.text || '{}'), id: crypto.randomUUID() };
  } catch (error: any) {
    handleAIError(error);
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Planeje 7 dias de refeições (${DIET_GOALS[dietGoal]}) usando: ${ingredients.join(", ")}.`;

    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: {
        systemInstruction: "Planejador Gastronômico Profissional. Responda apenas em JSON. Todos os campos de texto devem estar em Português do Brasil.",
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
    handleAIError(error);
    throw error;
  }
};

const handleAIError = (error: any) => {
  const msg = error.message || "";
  if (msg.includes("429") || msg.includes("QUOTA_EXCEEDED")) {
    throw new Error("API_QUOTA_EXCEEDED");
  }
  if (msg.includes("403") || msg.includes("PERMISSION_DENIED")) {
    throw new Error("API_KEY_INVALID_OR_LEAKED");
  }
  if (msg.includes("404")) {
    throw new Error("API_MODEL_NOT_FOUND");
  }
};

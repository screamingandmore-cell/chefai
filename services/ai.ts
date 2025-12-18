import { GoogleGenAI, Type } from "@google/genai";
import { WeeklyMenu, Recipe, Difficulty, DietGoal } from "../types";

// --- Configuração ---
// Verifica se a chave existe para evitar erros silenciosos
if (!process.env.API_KEY) {
  throw new Error("ERRO CRÍTICO: A variável de ambiente API_KEY não está definida.");
}

// O modelo ideal para tarefas rápidas e JSON
const MODEL_NAME = 'gemini-1.5-flash'; 

// --- Schemas ---

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

// --- Funções ---

export const analyzeFridgeImage = async (imagesBase64: string[]): Promise<string[]> => {
  // O "!" garante ao TypeScript que a chave existe (já validamos no topo do arquivo)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  
  try {
    const parts = [
      ...imagesBase64.map(base64 => ({
        inlineData: {
          mimeType: "image/jpeg",
          // Garante que o base64 está limpo (sem o prefixo data:image...)
          data: base64.includes(',') ? base64.split(',')[1] : base64
        }
      })),
      { text: "Liste apenas os nomes dos ingredientes visíveis nestas fotos em um array JSON." }
    ];

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts }, // Ajuste conforme a versão exata do SDK, mas 'parts' costuma ir dentro de contents
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

    const data = JSON.parse(response.text || "{}");
    return data.ingredients || [];
  } catch (error) {
    console.error("Erro no analyzeFridgeImage:", error);
    throw new Error("Erro ao analisar imagem.");
  }
};

export const generateQuickRecipe = async (
  ingredients: string[], 
  allergies: string[], 
  difficulty: Difficulty,
  goal: DietGoal
): Promise<Recipe> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  
  const prompt = `Crie 1 receita ${goal} usando: ${ingredients.join(", ")}. NÃO USE: ${allergies.join(", ")}. Dificuldade: ${difficulty}.`;
  
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { 
      parts: [{ text: prompt }] // Formato mais seguro para o novo SDK
    },
    config: {
      systemInstruction: "Você é o Chef.ai. Crie receitas práticas. Retorne JSON.",
      responseMimeType: "application/json",
      responseSchema: RECIPE_SCHEMA
    }
  });

  const parsed = JSON.parse(response.text || "{}");
  return { ...parsed, id: crypto.randomUUID() };
};

export const generateWeeklyMenu = async (
  ingredients: string[], 
  allergies: string[],
  dietGoal: DietGoal
): Promise<WeeklyMenu> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  
  const prompt = `Gere um cardápio semanal completo (7 dias, almoço e jantar) focado no objetivo: ${dietGoal}. 
                  Ingredientes que eu tenho: ${ingredients.join(", ")}. 
                  Evite estes ingredientes: ${allergies.join(", ")}.
                  Use os ingredientes que eu tenho como base, mas pode sugerir outros para completar as receitas.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      systemInstruction: "Você é um Chef e Nutricionista. Gere 14 refeições variadas. Retorne JSON estruturado com shoppingList e days.",
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

  const menuData = JSON.parse(response.text || "{}");
  
  return {
    ...menuData,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    goal: dietGoal
  };
};
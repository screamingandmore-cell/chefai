import { GoogleGenAI, Type } from "@google/genai";
import { WeeklyMenu, Recipe, Difficulty, DietGoal } from "../types";

// Inicializa o SDK do Google GenAI
// A API_KEY é obtida exclusivamente do ambiente conforme diretrizes
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Esquema para uma Receita Única
const RECIPE_PROPERTIES = {
  title: { type: Type.STRING, description: "Nome da receita" },
  description: { type: Type.STRING, description: "Breve descrição do prato" },
  ingredients: { 
    type: Type.ARRAY, 
    items: { type: Type.STRING },
    description: "Lista de ingredientes com quantidades"
  },
  instructions: { 
    type: Type.ARRAY, 
    items: { type: Type.STRING },
    description: "Passo a passo do preparo"
  },
  prepTime: { type: Type.STRING, description: "Tempo total (ex: 30 min)" },
  difficulty: { type: Type.STRING, description: "Nível de dificuldade" },
  calories: { type: Type.NUMBER, description: "Calorias estimadas por porção" },
  macros: {
    type: Type.OBJECT,
    properties: {
      protein: { type: Type.STRING, description: "Proteínas" },
      carbs: { type: Type.STRING, description: "Carboidratos" },
      fat: { type: Type.STRING, description: "Gorduras" }
    },
    required: ["protein", "carbs", "fat"]
  }
};

const RECIPE_SCHEMA = {
  type: Type.OBJECT,
  properties: RECIPE_PROPERTIES,
  required: ["title", "description", "ingredients", "instructions", "prepTime", "difficulty"]
};

/**
 * Analisa imagens da geladeira/despensa para extrair ingredientes.
 */
export const analyzeFridgeImage = async (imagesBase64: string[]): Promise<string[]> => {
  try {
    // FIX: Combine image and text parts in a single array literal to avoid TypeScript inference errors when using .push()
    const parts = [
      ...imagesBase64.map(base64 => ({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64.includes(',') ? base64.split(',')[1] : base64
        }
      })),
      { 
        text: "Liste todos os ingredientes comestíveis visíveis nestas fotos. Retorne apenas os nomes dos ingredientes em um array JSON." 
      }
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

    const data = JSON.parse(response.text || "{}");
    return data.ingredients || [];
  } catch (error) {
    console.error("Erro ao analisar imagem:", error);
    throw new Error("Não foi possível identificar os ingredientes pela foto.");
  }
};

/**
 * Gera uma única receita rápida baseada nos ingredientes disponíveis.
 */
export const generateQuickRecipe = async (
  ingredients: string[], 
  allergies: string[], 
  difficulty: Difficulty
): Promise<Recipe> => {
  try {
    const prompt = `Crie uma receita criativa usando estes ingredientes: ${ingredients.join(", ")}. 
                    Restrições (NÃO USE): ${allergies.join(", ")}. 
                    Dificuldade desejada: ${difficulty}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Você é o Chef.ai. Crie receitas práticas e saborosas. Retorne APENAS o JSON estruturado.",
        responseMimeType: "application/json",
        responseSchema: RECIPE_SCHEMA
      }
    });

    const recipeData = JSON.parse(response.text || "{}");
    return {
      ...recipeData,
      id: crypto.randomUUID()
    };
  } catch (error) {
    console.error("Erro ao gerar receita rápida:", error);
    throw new Error("Erro ao criar sua receita. Tente remover alguns ingredientes.");
  }
};

/**
 * Gera um planejamento semanal completo (7 dias).
 */
export const generateWeeklyMenu = async (
  ingredients: string[], 
  allergies: string[],
  dietGoal: DietGoal = 'balanced'
): Promise<WeeklyMenu> => {
  try {
    const prompt = `Crie um cardápio semanal (7 dias, almoço e jantar) focado no objetivo: ${dietGoal}. 
                    Ingredientes disponíveis: ${ingredients.join(", ")}. 
                    Alergias/Restrições: ${allergies.join(", ")}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Você é um Nutricionista e Chef experiente. Planeje refeições variadas. Retorne APENAS o JSON estruturado para 7 dias.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shoppingList: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Lista de itens extras necessários para comprar"
            },
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
  } catch (error) {
    console.error("Erro ao gerar cardápio semanal:", error);
    throw new Error("Falha ao organizar sua semana. Verifique sua conexão.");
  }
};
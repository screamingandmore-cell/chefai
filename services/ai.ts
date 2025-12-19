
import { GoogleGenAI, Type } from "@google/genai";
import { WeeklyMenu, Recipe, Difficulty, DietGoal, DIET_GOALS } from "../types";

// Schema definitions
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
    error: { type: Type.STRING },
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

const SYSTEM_PROMPT_CHEF = `Você é um Chef de Cozinha renomado, amigável e detalhista. 
Sua missão é criar receitas incríveis usando os ingredientes fornecidos.

REGRAS DE SEGURANÇA:
- Se os itens forem perigosos, tóxicos ou não comestíveis: NÃO GERE A RECEITA. Retorne o campo "error".

REGRAS DE QUALIDADE:
1. Quantidades: NUNCA liste apenas o ingrediente. Invente quantidades realistas.
2. Modo de Preparo: Seja detalhado e instrutivo.
3. Responda APENAS em JSON.`;

/**
 * Valida a existência da chave de API e retorna a instância do GoogleGenAI
 */
const getAIClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    const errorMsg = "CRITICAL ERROR: A variável de ambiente VITE_GEMINI_API_KEY não foi encontrada. Verifique seu arquivo .env ou as configurações de ambiente no provedor de hospedagem (Vercel).";
    console.error(errorMsg);
    throw new Error("Chave de API do Gemini não configurada.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeFridgeImage = async (imagesBase64: string[]): Promise<string[]> => {
  const ai = getAIClient();
  
  try {
    const parts: any[] = imagesBase64.map(base64 => ({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64.includes(',') ? base64.split(',')[1] : base64
      }
    }));
    parts.push({ text: "Analise cuidadosamente estas fotos e liste apenas os nomes dos ingredientes comestíveis encontrados em um array JSON chamado 'ingredients'." });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
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
    console.error("Erro na análise de imagem:", error);
    throw error;
  }
};

export const generateQuickRecipe = async (
  ingredients: string[], 
  allergies: string[], 
  difficulty: Difficulty,
  goal: DietGoal
): Promise<Recipe> => {
  const ai = getAIClient();
  
  let goalContext = `Objetivo: ${DIET_GOALS[goal]}.`;
  if (goal === 'chef_choice') {
    goalContext = "O usuário escolheu 'A Escolha do Chef'. IGNORE restrições de calorias ou dietas específicas (a menos que haja alergias). Seu único objetivo é criar a receita MAIS DELICIOSA, CRIATIVA e SABOROSA possível com esses ingredientes. Use técnicas de alta gastronomia se possível.";
  }

  const prompt = `${goalContext} Use principalmente: ${ingredients.join(", ")}. 
                  Evite absolutamente: ${allergies.join(", ")}. Nível de dificuldade: ${difficulty}.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT_CHEF,
      responseMimeType: "application/json",
      responseSchema: RECIPE_SCHEMA
    }
  });

  const data = JSON.parse(response.text || "{}");
  return { ...data, id: crypto.randomUUID() };
};

export const generateWeeklyMenu = async (
  ingredients: string[], 
  allergies: string[],
  dietGoal: DietGoal,
  difficulty: Difficulty
): Promise<WeeklyMenu> => {
  const ai = getAIClient();

  let goalContext = `Focado em ${DIET_GOALS[dietGoal]}.`;
  if (dietGoal === 'chef_choice') {
    goalContext = "O usuário escolheu 'A Escolha do Chef' para a semana. IGNORE restrições de dietas específicas. Seu único objetivo é criar um plano MAIS GASTRONÔMICO, DELICIOSO e CRIATIVO possível com esses ingredientes. Use técnicas de alta gastronomia se possível.";
  }

  const prompt = `Planeje um cardápio semanal completo ${goalContext} usando: ${ingredients.join(", ")}. 
                  Não use: ${allergies.join(", ")}. Nível de dificuldade: ${difficulty}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: `${SYSTEM_PROMPT_CHEF}\n\nPlaneje 14 refeições (7 dias, almoço e jantar). Responda em JSON com 'shoppingList' e 'days'.`,
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

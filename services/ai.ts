
import { GoogleGenAI, Type } from "@google/genai";
import { WeeklyMenu, Recipe, Difficulty, DietGoal, DIET_GOALS } from "../types";

// Usando gemini-3-pro-preview para tarefas que exigem raciocínio avançado (receitas e cardápios)
const MODEL_NAME_REASONING = 'gemini-3-pro-preview';
// Usando gemini-3-flash-preview para tarefas básicas de processamento de texto e visão
const MODEL_NAME_BASIC = 'gemini-3-flash-preview';

const RECIPE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Nome técnico e elegante do prato" },
    description: { type: Type.STRING, description: "Breve resumo do perfil de sabor e textura do prato" },
    ingredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Ingredientes com medidas exatas e estados (ex: cebola brunoise, manteiga noisette)" },
    instructions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Passos detalhados focados em técnica culinária. Explique o porquê de cada ação (ex: 'Sele a carne para criar a crosta de Maillard', 'Emulsione o molho lentamente')" },
    prepTime: { type: Type.STRING },
    difficulty: { type: Type.STRING },
    calories: { type: Type.NUMBER },
    chefTip: { type: Type.STRING, description: "O segredo técnico de mestre para garantir o sucesso do prato" },
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

const CHEF_SYSTEM_INSTRUCTION = `Você é um Chef Executivo de alta gastronomia e mentor técnico. 
Sua função não é bater papo, mas garantir a execução perfeita do prato através da educação técnica.
- Elimine saudações genéricas ou introduções longas. Vá direto ao ponto.
- No modo de preparo, seja um mentor: explique técnicas (ex: selar, deglaçar, branquear).
- Ensine o usuário a identificar os pontos dos alimentos visualmente ou pelo olfato.
- Use um vocabulário culinário profissional mas acessível.
- O foco total é a precisão do modo de preparo para evitar erros do usuário.
- Responda estritamente no formato JSON solicitado.`;

// Fix: Creating a new GoogleGenAI instance directly from process.env.API_KEY as per guidelines.
// Removed complex key selection logic as it is not required for these models.
async function initializeAI() {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const analyzeFridgeImage = async (imagesBase64: string[]): Promise<string[]> => {
  try {
    const ai = await initializeAI();
    const imageParts = imagesBase64.map(base64 => ({
      inlineData: {
        data: base64.includes(',') ? base64.split(',')[1] : base64,
        mimeType: "image/jpeg"
      }
    }));

    const response = await ai.models.generateContent({
      model: MODEL_NAME_BASIC,
      contents: { 
        parts: [
          ...imageParts,
          { text: "Identifique todos os ingredientes visíveis na imagem com precisão técnica de inventário. Liste os nomes dos ingredientes obrigatoriamente em Português do Brasil (PT-BR). Não use inglês." }
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
  } catch (error) {
    console.error("Erro na análise visual:", error);
    return [];
  }
};

export const generateQuickRecipe = async (
  ingredients: string[], 
  allergies: string[], 
  difficulty: Difficulty,
  goal: DietGoal
): Promise<Recipe> => {
  try {
    const ai = await initializeAI();
    const prompt = `Chef, crie uma receita de nível ${difficulty} focado em ${DIET_GOALS[goal]}.
                    Ingredientes disponíveis: ${ingredients.join(", ")}. 
                    Restrições severas: ${allergies.join(", ")}. 
                    Foco total na precisão técnica das instruções de preparo.`;
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME_REASONING,
      contents: prompt,
      config: {
        systemInstruction: CHEF_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RECIPE_SCHEMA
      }
    });

    const text = response.text;
    if (!text) throw new Error("Resposta vazia da IA");
    
    return { ...JSON.parse(text), id: crypto.randomUUID() };
  } catch (error: any) {
    console.error("Erro ao gerar receita:", error);
    throw new Error("O Chef encontrou um erro na bancada. Tente novamente.");
  }
};

export const generateWeeklyMenu = async (
  ingredients: string[], 
  allergies: string[],
  dietGoal: DietGoal,
  difficulty: Difficulty
): Promise<WeeklyMenu> => {
  try {
    const ai = await initializeAI();
    const prompt = `Planejamento técnico semanal: estilo ${DIET_GOALS[dietGoal]}.
                    Ingredientes base: ${ingredients.join(", ")}. 
                    Alergias: ${allergies.join(", ")}. 
                    Dificuldade técnica: ${difficulty}. 
                    Maximize o uso eficiente dos insumos ao longo dos 7 dias.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME_REASONING,
      contents: prompt,
      config: {
        systemInstruction: CHEF_SYSTEM_INSTRUCTION + " Otimize o 'prep-work' (pré-preparo) para que o usuário ganhe tempo.",
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

    const text = response.text;
    if (!text) throw new Error("Resposta vazia da IA");

    const data = JSON.parse(text);
    return { 
      ...data, 
      id: crypto.randomUUID(), 
      createdAt: new Date().toISOString(), 
      goal: dietGoal 
    };
  } catch (error) {
    console.error("Erro ao gerar cardápio semanal:", error);
    throw new Error("Erro técnico no planejamento semanal.");
  }
};

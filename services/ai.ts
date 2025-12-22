// --- ATENÇÃO: A IMPORTAÇÃO CORRETA É ESTA ABAIXO ---
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { WeeklyMenu, Recipe, Difficulty, DietGoal, DIET_GOALS } from "../types";

// Configuração do Modelo (O ÚNICO QUE FUNCIONA BEM AGORA)
const MODEL_NAME = "gemini-1.5-flash";

// Chaves do .env
const apiKeyText = import.meta.env.VITE_GEMINI_API_KEY || "";
const apiKeyImage = import.meta.env.VITE_GEMINI_API_KEY_IMAGE || "";

// Validação de Segurança
if (!apiKeyText) console.warn("Faltando chave de TEXTO no .env");
if (!apiKeyImage) console.warn("Faltando chave de IMAGEM no .env");

// Instâncias da IA
const genAI_Text = new GoogleGenerativeAI(apiKeyText);
const genAI_Image = new GoogleGenerativeAI(apiKeyImage);

// --- SCHEMAS E FUNÇÕES ---

// 1. Analisar Imagem
export const analyzeFridgeImage = async (imagesBase64: string[]): Promise<string[]> => {
  try {
    const model = genAI_Image.getGenerativeModel({ 
        model: MODEL_NAME,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    ingredients: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                }
            }
        }
    });

    const imageParts = imagesBase64.map(base64 => ({
      inlineData: {
        data: base64.includes(',') ? base64.split(',')[1] : base64,
        mimeType: "image/jpeg"
      }
    }));

    const result = await model.generateContent([
        "Liste APENAS os ingredientes comestíveis visíveis (frutas, legumes, carnes) em português.", 
        ...imageParts
    ]);
    
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text).ingredients || [];

  } catch (error) {
    console.error("Erro na imagem:", error);
    return [];
  }
};

// 2. Gerar Receita
export const generateQuickRecipe = async (ingredients: string[], allergies: string[], difficulty: Difficulty, goal: DietGoal): Promise<Recipe> => {
  const model = genAI_Text.getGenerativeModel({ model: MODEL_NAME, generationConfig: { responseMimeType: "application/json" } });
  
  const prompt = `Crie uma receita com: ${ingredients.join(", ")}. Objetivo: ${goal}. Dificuldade: ${difficulty}. Retorne JSON completo da receita.`;
  
  const result = await model.generateContent(prompt);
  const data = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
  return { ...data, id: crypto.randomUUID() };
};

// 3. Gerar Menu Semanal
export const generateWeeklyMenu = async (ingredients: string[], allergies: string[], dietGoal: DietGoal, difficulty: Difficulty): Promise<WeeklyMenu> => {
  const model = genAI_Text.getGenerativeModel({ model: MODEL_NAME, generationConfig: { responseMimeType: "application/json" } });

  const prompt = `Crie um menu semanal JSON { "shoppingList": [], "days": [...] } usando: ${ingredients.join(", ")}.`;

  const result = await model.generateContent(prompt);
  const data = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
  return { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString(), goal: dietGoal };
};
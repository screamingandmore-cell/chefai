// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI, Type } from "@google/genai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000);

  try {
    const { action, ingredients, allergies, difficulty, dietGoal, images } = await req.json();
    
    // Initialize Gemini with API Key from process.env as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    if (action === 'generate-quick-recipe') {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Crie uma receita nível ${difficulty} com: ${ingredients?.join(', ')}. Evite: ${allergies?.join(',')}. Mantenha instruções em no máximo 4 passos curtos.`,
        config: {
          systemInstruction: "Você é o Chef.ai. Gere apenas JSON puro. Seja extremamente conciso nas instruções.",
          responseMimeType: "application/json",
          responseSchema: RECIPE_SCHEMA
        }
      });
      
      clearTimeout(timeoutId);
      return new Response(response.text, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } 
    
    else if (action === 'generate-weekly-menu') {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Gere cardápio semanal (almoço/jantar) dieta ${dietGoal}. Ingredientes base: ${ingredients?.join(',')}. Restrições: ${allergies?.join(',')}.
        REGRA: Máximo 3 ou 4 passos por receita.`,
        config: {
          systemInstruction: "Você é um Nutricionista Gourmet. Planeje 14 refeições curtas. Retorne JSON.",
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

      clearTimeout(timeoutId);
      return new Response(response.text, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    else if (action === 'analyze-fridge' && images) {
      const parts = images.map((img: string) => ({
        inlineData: {
          mimeType: 'image/jpeg',
          data: img.includes(',') ? img.split(',')[1] : img
        }
      }));
      parts.push({ text: "Liste apenas os nomes dos ingredientes comestíveis identificados." });

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

      clearTimeout(timeoutId);
      return new Response(response.text, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: "INVALID_ACTION" }), { status: 400, headers: corsHeaders });

  } catch (error: any) {
    clearTimeout(timeoutId);
    return new Response(JSON.stringify({ 
      error: error.name === 'AbortError' ? "TIMEOUT" : "SERVER_ERROR", 
      message: error.message 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  }
});
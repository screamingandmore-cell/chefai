// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI, Type } from "npm:@google/genai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `Chef.ai: IA culinária focada em economia. Responda APENAS JSON. Use o que o usuário tem. Evite compras. Proibido: temas não culinários.`;

serve(async (req: Request) => {
  // Resposta imediata para preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Não autorizado: Token ausente.");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? "",
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) throw new Error("Sessão inválida.");

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const body = await req.json();
    const { action, ingredients, allergies, difficulty, images, dietGoal } = body;
    
    const apiKey = Deno.env.get('API_KEY') || Deno.env.get('GEMINI_API_KEY');
    const ai = new GoogleGenAI({ apiKey });

    let responseData: any;

    if (action === 'generate-quick-recipe') {
      const prompt = `Gere uma receita rápida de dificuldade ${difficulty} usando: ${ingredients?.join(', ')}. Alergias: ${allergies?.join(',')}.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
              prepTime: { type: Type.STRING },
              difficulty: { type: Type.STRING }
            }
          }
        }
      });
      responseData = JSON.parse(response.text || "{}");
      responseData.id = crypto.randomUUID();
    } 
    
    else if (action === 'generate-weekly-menu') {
      const prompt = `Gere um cardápio semanal para objetivo ${dietGoal}. Ingredientes base: ${ingredients?.join(',')}.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
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
                    lunch: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                        instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }
                    },
                    dinner: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                        instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });
      
      const data = JSON.parse(response.text || "{}");
      responseData = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        goal: dietGoal,
        days: data.days || [],
        shoppingList: data.shoppingList || []
      };
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
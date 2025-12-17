
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI, Type } from "npm:@google/genai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Chef.ai: IA culinária focada em economia. Responda APENAS JSON. Use o que o usuário tem. Evite compras. Proibido: temas não culinários.`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Não autorizado: Token ausente.");

    // 1. Inicializa Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? "",
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    );

    // 2. Valida o usuário através do Token JWT
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) throw new Error("Sessão inválida ou expirada.");

    // 3. Busca o perfil real no banco
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) throw new Error("Perfil de usuário não encontrado.");

    const { action, ingredients, allergies, difficulty, images, dietGoal } = await req.json();
    const isPremium = profile.is_premium;
    
    // Fix: Using Gemini API as per guidelines. API_KEY should be set in Supabase secrets.
    const apiKey = Deno.env.get('API_KEY') || Deno.env.get('GEMINI_API_KEY');
    const ai = new GoogleGenAI({ apiKey });

    // --- LOGICA DE COTAS ---
    if (!isPremium) {
      if (action === 'generate-quick-recipe' && (profile.usage_quick_recipes || 0) >= 10) {
        return new Response(JSON.stringify({ error: "LIMIT_REACHED" }), { status: 403, headers: corsHeaders });
      }
      if (action === 'generate-weekly-menu' && (profile.usage_weekly_menus || 0) >= 3) {
        return new Response(JSON.stringify({ error: "LIMIT_REACHED" }), { status: 403, headers: corsHeaders });
      }
    }

    let responseData: any;

    // --- EXECUÇÃO DAS AÇÕES ---
    if (action === 'analyze-fridge') {
      // Fix: Migrated image analysis to Gemini 3 Flash
      const parts = [
        { text: "Liste os ingredientes comestíveis identificados nestas fotos de geladeira/despensa. Responda em JSON: {ingredients: []}" },
        ...(images || []).map(img => {
          const [mimePart, dataPart] = img.split(';base64,');
          const mimeType = mimePart.split(':')[1] || 'image/jpeg';
          return {
            inlineData: {
              mimeType: mimeType,
              data: dataPart
            }
          };
        })
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ingredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      });
      
      responseData = JSON.parse(response.text || "{}").ingredients || [];
    } 
    
    else if (action === 'generate-quick-recipe') {
      // Fix: Migrated recipe generation to Gemini 3 Flash for speed and accuracy
      const prompt = `Gere uma receita de dificuldade ${difficulty} usando preferencialmente: ${ingredients.join(', ')}. Alergias/Restrições: ${allergies?.join(',')}. ${isPremium ? 'É obrigatório incluir macros detalhados.' : 'Não inclua macros.'}`;
      
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
              difficulty: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              macros: {
                type: Type.OBJECT,
                properties: {
                  protein: { type: Type.STRING },
                  carbs: { type: Type.STRING },
                  fat: { type: Type.STRING }
                }
              }
            },
            propertyOrdering: ["title", "description", "ingredients", "instructions", "prepTime", "difficulty"]
          }
        }
      });
      
      responseData = JSON.parse(response.text || "{}");
      responseData.id = crypto.randomUUID();
      
      await supabaseAdmin.from('profiles').update({ usage_quick_recipes: (profile.usage_quick_recipes || 0) + 1 }).eq('id', user.id);
    } 
    
    else if (action === 'generate-weekly-menu') {
      // Fix: Migrated complex weekly menu generation to Gemini 3 Pro
      const goal = dietGoal === 'fit' ? 'FIT (Saudável/Leve)' : dietGoal;
      const prompt = `Gere um cardápio semanal completo (Segunda a Domingo, Almoço e Jantar) com objetivo ${goal}. Base de ingredientes: ${ingredients.join(',')}. Alergias: ${allergies?.join(',')}. ${isPremium ? 'Inclua macros em todas as receitas.' : 'Sem macros.'}`;
      
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
                        instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        calories: { type: Type.NUMBER },
                        macros: {
                          type: Type.OBJECT,
                          properties: {
                            protein: { type: Type.STRING },
                            carbs: { type: Type.STRING },
                            fat: { type: Type.STRING }
                          }
                        }
                      }
                    },
                    dinner: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                        instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        calories: { type: Type.NUMBER },
                        macros: {
                          type: Type.OBJECT,
                          properties: {
                            protein: { type: Type.STRING },
                            carbs: { type: Type.STRING },
                            fat: { type: Type.STRING }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            propertyOrdering: ["shoppingList", "days"]
          }
        }
      });
      
      const data = JSON.parse(response.text || "{}");
      responseData = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        goal: dietGoal,
        days: data.days?.map(d => ({
          ...d,
          lunch: { ...d.lunch, id: crypto.randomUUID() },
          dinner: { ...d.dinner, id: crypto.randomUUID() }
        })) || [],
        shoppingList: data.shoppingList || []
      };

      await supabaseAdmin.from('profiles').update({ usage_weekly_menus: (profile.usage_weekly_menus || 0) + 1 }).eq('id', user.id);
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Chef API Global Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message === "LIMIT_REACHED" ? 403 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

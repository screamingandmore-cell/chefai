
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = { 
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => { 
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Timeout de 58 segundos (Supabase mata aos 60s)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 58000); 

  try { 
    const { action, ingredients, allergies, difficulty, dietGoal, images } = await req.json()
    
    const apiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('API_KEY')
    
    if (!apiKey) {
      throw new Error("API Key não configurada no Vault do Supabase.")
    }

    const model = "gpt-4o-mini"
    const systemPrompt = "Você é um Chef Master e Nutricionista Gourmet. Crie receitas detalhadas passo a passo. Responda apenas com o JSON solicitado."
    
    let userPrompt = ""

    if (action === 'generate-quick-recipe') {
      userPrompt = `Crie uma receita nível ${difficulty} com: ${ingredients.join(', ')}. Evite: ${allergies.join(',')}. JSON: { "title": "...", "description": "...", "ingredients": [], "instructions": [], "prepTime": "...", "difficulty": "...", "calories": 0, "macros": { "protein": "...", "carbs": "...", "fat": "..." } }`
    } 
    else if (action === 'generate-weekly-menu') {
      userPrompt = `Gere cardápio completo de 7 dias (almoço/jantar) focado em ${dietGoal}. Use: ${ingredients.join(',')}. Evite: ${allergies.join(',')}. JSON: { "shoppingList": [], "days": [ { "day": "Segunda-feira", "lunch": { "title": "...", "ingredients": [], "instructions": [], "prepTime": "...", "calories": 0, "macros": { "protein": "...", "carbs": "...", "fat": "..." } }, "dinner": { "title": "...", "ingredients": [], "instructions": [], "prepTime": "...", "calories": 0, "macros": { "protein": "...", "carbs": "...", "fat": "..." } } } ] }`
    }
    else if (action === 'analyze-fridge' && images) {
      userPrompt = [
        { type: "text", text: "Identifique ingredientes e temperos nestas fotos. JSON: { \"ingredients\": [] }" },
        ...images.map(img => ({ type: "image_url", image_url: { url: img } }))
      ]
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: Array.isArray(userPrompt) ? userPrompt : [{ type: "text", text: userPrompt }] }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    })

    clearTimeout(timeoutId);

    const aiData = await response.json()
    if (aiData.error) throw new Error(aiData.error.message)

    const result = JSON.parse(aiData.choices[0].message.content)
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) { 
    clearTimeout(timeoutId);
    const isTimeout = error.name === 'AbortError';
    
    return new Response(JSON.stringify({ 
      error: "SERVER_TIMEOUT", 
      message: isTimeout 
        ? "A OpenAI demorou mais de 60 segundos. Tente reduzir o número de ingredientes ou simplificar o plano." 
        : error.message 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }) 
  } 
})

// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = { 
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => { 
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try { 
    const { action, ingredients, allergies, difficulty, dietGoal, images } = await req.json()
    
    const apiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('API_KEY')
    
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: "CONFIG_ERROR", 
        message: "Chave OPENAI_API_KEY não configurada no Supabase." 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    let model = "gpt-4o-mini"
    let systemPrompt = "Você é o Chef.ai, um assistente culinário e nutricionista. Responda APENAS JSON puro. Importante: Sempre inclua estimativas de calorias e macros (proteína, carboidratos, gorduras) em todas as receitas."
    let userPrompt = ""

    if (action === 'generate-quick-recipe') {
      userPrompt = `Crie uma receita nível ${difficulty} com: ${ingredients.join(', ')}. Evite: ${allergies.join(',')}. 
      Responda neste formato JSON: { 
        "title": "...", 
        "description": "...", 
        "ingredients": [], 
        "instructions": [], 
        "prepTime": "...", 
        "difficulty": "...",
        "calories": 0,
        "macros": { "protein": "0g", "carbs": "0g", "fat": "0g" }
      }`
    } 
    else if (action === 'generate-weekly-menu') {
      // Prompt otimizado para velocidade: pedimos instruções concisas para evitar timeout
      userPrompt = `Crie um cardápio de 7 dias (almoço e jantar) para o objetivo ${dietGoal} usando: ${ingredients.join(',')}. 
      Instruções das receitas devem ser curtas e diretas para velocidade.
      Responda neste formato JSON: { 
        "shoppingList": [], 
        "days": [ { 
          "day": "Segunda", 
          "lunch": { "title": "...", "ingredients": [], "instructions": [], "prepTime": "...", "difficulty": "...", "calories": 0, "macros": { "protein": "0g", "carbs": "0g", "fat": "0g" } },
          "dinner": { "title": "...", "ingredients": [], "instructions": [], "prepTime": "...", "difficulty": "...", "calories": 0, "macros": { "protein": "0g", "carbs": "0g", "fat": "0g" } }
        } ] 
      }`
    }
    else if (action === 'analyze-fridge' && images) {
      model = "gpt-4o"
      userPrompt = [
        { type: "text", text: "Liste apenas os nomes dos ingredientes comestíveis visíveis nestas fotos. Retorne JSON: { \"ingredients\": [] }" },
        ...images.map(img => ({ type: "image_url", image_url: { url: img } }))
      ]
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: Array.isArray(userPrompt) ? userPrompt : [{ type: "text", text: userPrompt }] }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 4000 // Aumentado para garantir que o cardápio não seja cortado
      })
    })

    const aiData = await response.json()
    
    if (aiData.error) {
      throw new Error(`OpenAI: ${aiData.error.message}`)
    }

    let result = JSON.parse(aiData.choices[0].message.content)

    if (action === 'generate-weekly-menu') {
      result.id = crypto.randomUUID()
      result.createdAt = new Date().toISOString()
      result.goal = dietGoal
    } else {
      result.id = result.id || crypto.randomUUID()
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) { 
    console.error("Erro Crítico OpenAI:", error.message)
    return new Response(JSON.stringify({ 
      error: "ERRO_IA", 
      message: error.message.includes('timeout') ? "O servidor demorou muito. Tente com menos ingredientes ou uma dieta mais simples." : error.message 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200, 
    }) 
  } 
})

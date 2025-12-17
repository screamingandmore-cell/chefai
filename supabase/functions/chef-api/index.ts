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
    
    // Usa a chave da OpenAI configurada no seu Supabase
    const apiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('API_KEY')
    
    if (!apiKey) {
      throw new Error("Chave OPENAI_API_KEY não encontrada nas variáveis de ambiente do Supabase.")
    }

    // O gpt-4o-mini é ideal aqui: ele é ultra rápido (evita timeout) e mantém alta qualidade.
    let model = "gpt-4o-mini"
    let systemPrompt = "Você é um Chef de Cozinha renomado e Nutricionista. Crie receitas detalhadas, ricas e gourmet. Não economize nas palavras: explique bem o passo a passo e garanta que os sabores sejam harmoniosos. Inclua sempre calorias e macros. Responda APENAS em JSON."
    let userPrompt = ""

    if (action === 'generate-quick-recipe') {
      userPrompt = `Crie uma receita nível ${difficulty} usando estes ingredientes: ${ingredients.join(', ')}. Evite: ${allergies.join(',')}. 
      A receita deve ser completa e bem explicada.
      JSON: { "title": "...", "description": "...", "ingredients": [], "instructions": [], "prepTime": "...", "difficulty": "...", "calories": 0, "macros": { "protein": "...", "carbs": "...", "fat": "..." } }`
    } 
    else if (action === 'generate-weekly-menu') {
      userPrompt = `Gere um cardápio semanal completo (7 dias, almoço e jantar) para o objetivo ${dietGoal}. 
      Ingredientes base: ${ingredients.join(',')}. Restrições: ${allergies.join(',')}.
      As receitas devem ser detalhadas, variadas e explicadas passo a passo.
      JSON: { 
        "shoppingList": [], 
        "days": [ 
          { 
            "day": "Segunda-feira", 
            "lunch": { "title": "...", "ingredients": [], "instructions": [], "prepTime": "...", "calories": 0, "macros": { "protein": "...", "carbs": "...", "fat": "..." } },
            "dinner": { "title": "...", "ingredients": [], "instructions": [], "prepTime": "...", "calories": 0, "macros": { "protein": "...", "carbs": "...", "fat": "..." } }
          }
          // ... repetir para os 7 dias
        ] 
      }`
    }
    else if (action === 'analyze-fridge' && images) {
      userPrompt = [
        { type: "text", text: "Liste todos os ingredientes identificáveis nestas fotos. JSON: { \"ingredients\": [] }" },
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
        temperature: 0.7
      })
    })

    const aiData = await response.json()
    if (aiData.error) throw new Error(aiData.error.message)

    let result = JSON.parse(aiData.choices[0].message.content)

    if (action === 'generate-weekly-menu') {
      result.id = crypto.randomUUID()
      result.createdAt = new Date().toISOString()
      result.goal = dietGoal
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) { 
    console.error("Erro na Edge Function:", error.message)
    return new Response(JSON.stringify({ 
      error: "SERVER_ERROR", 
      message: "A geração demorou ou falhou. Verifique sua chave OpenAI ou tente novamente." 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }) 
  } 
})

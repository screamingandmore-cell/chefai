// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = { 
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const SYSTEM_PROMPT = "Você é o Chef.ai, um assistente culinário profissional. Responda APENAS JSON puro, sem markdown ou textos explicativos fora do JSON.";

serve(async (req) => { 
  // 1. Resposta obrigatória para Preflight CORS
  if (req.method === 'OPTIONS') { 
    return new Response('ok', { headers: corsHeaders }) 
  }

  try { 
    const { action, ingredients, allergies, difficulty, dietGoal, images } = await req.json()

    // 2. Verificação da Chave
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: "CONFIG_ERROR", 
        message: "Chave OPENAI_API_KEY não configurada no Supabase." 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    let model = "gpt-4o-mini"
    let messages = []

    // 3. Preparação dos Prompts
    if (action === 'generate-quick-recipe') {
      messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Crie uma receita nível ${difficulty} usando apenas ou principalmente: ${ingredients?.join(', ')}. Evite usar: ${allergies?.join(',') || 'Nenhuma'}. 
        Retorne rigorosamente este formato JSON: { "title": "...", "description": "...", "ingredients": [], "instructions": [], "prepTime": "...", "difficulty": "..." }` }
      ]
    } 
    else if (action === 'generate-weekly-menu') {
      messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Crie um cardápio semanal (7 dias, almoço e jantar) para o objetivo ${dietGoal}. Baseado em: ${ingredients?.join(',')}. 
        Retorne rigorosamente este formato JSON: { "shoppingList": [], "days": [ { "day": "Segunda-feira", "lunch": { "title": "...", "ingredients": [], "instructions": [], "prepTime": "...", "difficulty": "..." }, "dinner": { "title": "...", "ingredients": [], "instructions": [], "prepTime": "...", "difficulty": "..." } } ] }` }
      ]
    }
    else if (action === 'analyze-fridge' && images) {
      model = "gpt-4o" // Modelo com visão computacional
      const imageParts = images.map((img: string) => ({ 
        type: "image_url", 
        image_url: { url: img } 
      }));
      
      messages = [
        { role: "user", content: [
          { type: "text", text: "Liste apenas os nomes dos ingredientes comestíveis visíveis nestas fotos. Retorne JSON: { \"ingredients\": [] }" }, 
          ...imageParts
        ] }
      ]
    }

    // 4. Chamada à API da OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    })

    const aiData = await openAIResponse.json()
    
    if (aiData.error) {
      throw new Error(`OpenAI API Error: ${aiData.error.message}`)
    }

    // 5. Tratamento e Enriquecimento para o Frontend
    const rawContent = aiData.choices[0].message.content
    let content = JSON.parse(rawContent)

    // Injeção de metadados obrigatórios para não quebrar a UI
    if (action === 'generate-weekly-menu') {
      content = {
        ...content,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        goal: dietGoal
      }
    } else {
      content.id = content.id || crypto.randomUUID()
    }

    return new Response(JSON.stringify(content), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) { 
    console.error("Erro na Edge Function:", error.message)
    return new Response(JSON.stringify({ error: "INTERNAL_ERROR", message: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200, 
    }) 
  } 
})

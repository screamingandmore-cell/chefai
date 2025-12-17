
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const SYSTEM_PROMPT = `Você é o Chef.ai, um assistente de cozinha ultra-eficiente. 
Responda APENAS com o objeto JSON solicitado, sem texto adicional. 
As receitas devem ser nutritivas, econômicas e o modo de preparo deve ser extremamente direto.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Timeout de segurança para evitar que a função fique pendurada
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000);

  try {
    const { action, ingredients, allergies, difficulty, dietGoal, images } = await req.json()
    
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) throw new Error("Chave OPENAI_API_KEY não configurada no Supabase.")

    let model = "gpt-4o-mini"
    let messages = []
    let temperature = 0.5 // Menor temperatura para maior consistência no JSON

    if (action === 'generate-quick-recipe') {
      messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Crie 1 receita nível ${difficulty} com: ${ingredients?.join(', ')}. Evite: ${allergies?.join(',')}. 
        Retorne JSON: { "title": "Nome", "description": "Resumo", "ingredients": ["item 1"], "instructions": ["Passo 1", "Passo 2", "Passo 3", "Passo 4"], "prepTime": "00 min", "difficulty": "${difficulty}", "calories": 0, "macros": {"protein": "0g", "carbs": "0g", "fat": "0g"} }` }
      ]
    } 
    
    else if (action === 'generate-weekly-menu') {
      messages = [
        { role: "system", content: "Você é um planejador de refeições ultra-rápido. Gere JSON estruturado." },
        { role: "user", content: `Crie um cardápio semanal (Almoço e Jantar) focado em: ${dietGoal}. Use preferencialmente: ${ingredients?.join(',')}. Restrições: ${allergies?.join(',')}.
        
        REGRA CRÍTICA DE PERFORMANCE:
        O campo "instructions" de cada prato DEVE ter no máximo 4 passos curtos e densos. 
        Exemplo: "1. Refogue o alho e cebola. 2. Adicione o frango e doure. 3. Junte o arroz e água. 4. Cozinhe por 15min."
        
        Retorne este JSON: 
        { 
          "shoppingList": ["item"], 
          "days": [
            { 
              "day": "Segunda-feira", 
              "lunch": { "title": "Nome", "description": "Resumo", "ingredients": ["lista"], "instructions": ["Passo 1", "Passo 2", "Passo 3", "Passo 4"], "prepTime": "20 min", "difficulty": "Fácil", "calories": 450, "macros": {"protein": "30g", "carbs": "50g", "fat": "15g"} },
              "dinner": { "title": "Nome", "description": "Resumo", "ingredients": ["lista"], "instructions": ["Passo 1", "Passo 2", "Passo 3"], "prepTime": "15 min", "difficulty": "Fácil", "calories": 350, "macros": {"protein": "25g", "carbs": "20g", "fat": "10g"} }
            }
          ] 
        }` }
      ]
    }

    else if (action === 'analyze-fridge' && images) {
      model = "gpt-4o-mini" // gpt-4o-mini agora suporta visão e é mais rápido
      const imageContents = images.map((img: string) => ({ 
        type: "image_url", 
        image_url: { url: img } 
      }));
      messages = [{ 
        role: "user", 
        content: [
          { type: "text", text: "Liste apenas os nomes dos ingredientes comestíveis identificados nestas fotos em um JSON: { \"ingredients\": [] }" }, 
          ...imageContents
        ] 
      }]
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: model,
        messages: messages,
        response_format: { type: "json_object" },
        temperature: temperature
      })
    })

    clearTimeout(timeoutId);
    const data = await response.json()
    
    if (data.error) throw new Error(data.error.message)

    return new Response(data.choices[0].message.content, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    clearTimeout(timeoutId);
    return new Response(JSON.stringify({ 
      error: error.name === 'AbortError' ? "TIMEOUT" : "SERVER_ERROR", 
      message: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Mantemos 200 para tratar o erro amigavelmente no front
    })
  }
})

// Arquivo: teste-ia.js
// Diagnóstico de Modelos Disponíveis

// --- SUA CHAVE NOVA AQUI ---
const API_KEY = "AIzaSyCovCrmDh0EBkT-DZYgVw2CkeK5yjF7rIk"; 

async function listarModelos() {
  console.log("🔍 Verificando modelos disponíveis para esta chave...");
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("❌ ERRO DA CONTA GOOGLE:");
      console.error(JSON.stringify(data.error, null, 2));
      
      if (data.error.message.includes("has not enabled")) {
        console.log("\n💡 SOLUÇÃO: Você precisa ativar a API no painel do Google Cloud.");
      }
    } else {
      console.log("✅ SUCESSO! A chave funciona. Modelos disponíveis:");
      if (data.models) {
        data.models.forEach(m => console.log(` - ${m.name}`));
        
        // Verifica se o flash está na lista
        const temFlash = data.models.some(m => m.name.includes("flash"));
        if (temFlash) {
            console.log("\n🎉 ÓTIMA NOTÍCIA: O modelo Flash ESTÁ na lista. O erro anterior era instabilidade.");
        } else {
            console.log("\n⚠️ ALERTA: O modelo Flash NÃO apareceu na lista. Precisamos usar outro nome que apareceu acima.");
        }
      } else {
        console.log("⚠️ A lista voltou vazia. Estranho.");
      }
    }

  } catch (error) {
    console.error("Erro de conexão:", error);
  }
}

listarModelos();
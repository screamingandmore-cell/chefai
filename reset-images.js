import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

console.log('🔄 Iniciando RENOMEAÇÃO FORÇADA de imagens...');

if (!fs.existsSync(publicDir)) {
    console.error('❌ Pasta public não encontrada!');
    process.exit(1);
}

// Ler arquivos PNG
const files = fs.readdirSync(publicDir).filter(f => f.toLowerCase().endsWith('.png'));

let screenCount = 1;

files.forEach(file => {
    const oldPath = path.join(publicDir, file);
    let newName = file.toLowerCase();

    // Preservar Ícones
    if (file.includes('192')) {
        newName = 'icon-192.png';
    } else if (file.includes('512')) {
        newName = 'icon-512.png';
    } 
    // Renomear Screenshots para um nome NUNCA USADO ANTES
    // Isso obriga o Git a detectar como arquivo novo
    else {
        newName = `pwa-shot-${screenCount}.png`;
        screenCount++;
    }

    const newPath = path.join(publicDir, newName);

    if (file !== newName) {
        try {
            fs.renameSync(oldPath, newPath);
            console.log(`✅ Renomeado: ${file} -> ${newName}`);
        } catch (e) {
            console.error(`Erro ao renomear ${file}:`, e);
        }
    }
});

console.log('🎉 Imagens renomeadas! Agora o Git vai detectar mudanças.');
console.log('👉 Execute: git add . && git commit -m "Novas fotos PWA" && git push');
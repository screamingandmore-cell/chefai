import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

console.log('🔄 Iniciando PADRONIZAÇÃO para PNG...');

if (!fs.existsSync(publicDir)) {
    console.error('❌ Pasta public não encontrada!');
    process.exit(1);
}

// Ler apenas arquivos PNG (O usuário deve converter manualmente)
const files = fs.readdirSync(publicDir).filter(f => {
    return f.toLowerCase().endsWith('.png');
});

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
    // Renomear Screenshots
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

console.log('🎉 Imagens PNG organizadas!');
console.log('👉 Lembre-se de deletar os JPGs antigos se houver!');
console.log('👉 DEPOIS RODE:');
console.log('   git add .');
console.log('   git commit -m "Volta para PNG"');
console.log('   git push');
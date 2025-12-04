import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

console.log('🔄 Iniciando RENOMEAÇÃO para JPG...');

if (!fs.existsSync(publicDir)) {
    console.error('❌ Pasta public não encontrada!');
    process.exit(1);
}

// Ler arquivos de imagem (PNG e JPG)
const files = fs.readdirSync(publicDir).filter(f => {
    const lower = f.toLowerCase();
    return lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg');
});

let screenCount = 1;

files.forEach(file => {
    const oldPath = path.join(publicDir, file);
    let newName = file.toLowerCase();
    const ext = path.extname(file).toLowerCase(); // .jpg ou .png

    // Preservar Ícones (Geralmente são PNG)
    if (file.includes('192')) {
        newName = 'icon-192.png';
    } else if (file.includes('512')) {
        newName = 'icon-512.png';
    } 
    // Renomear Screenshots
    else {
        // Forçar extensão para .jpg se for screenshot, pois o usuário disse que são jpg
        // Se o arquivo original for png, mantemos png, se for jpg, mantemos jpg
        newName = `pwa-shot-${screenCount}${ext}`;
        screenCount++;
    }

    const newPath = path.join(publicDir, newName);

    // Só renomeia se o nome for diferente
    if (file !== newName) {
        try {
            fs.renameSync(oldPath, newPath);
            console.log(`✅ Renomeado: ${file} -> ${newName}`);
        } catch (e) {
            console.error(`Erro ao renomear ${file}:`, e);
        }
    }
});

console.log('🎉 Imagens organizadas!');
console.log('👉 AGORA RODE NO TERMINAL:');
console.log('   git add .');
console.log('   git commit -m "Ajuste fotos JPG"');
console.log('   git push');

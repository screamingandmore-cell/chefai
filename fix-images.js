import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, 'public');

console.log('🔍 Iniciando diagnóstico de imagens na pasta public...');

if (!fs.existsSync(publicDir)) {
    console.error('❌ Pasta public não encontrada!');
    process.exit(1);
}

const files = fs.readdirSync(publicDir);
let fixedCount = 0;

files.forEach(file => {
    let newName = file;

    // 1. Remove .png duplicado (ex: icon.png.png -> icon.png)
    if (newName.endsWith('.png.png')) {
        newName = newName.replace('.png.png', '.png');
    }

    // 2. Transforma em minúsculo (ex: Icon.png -> icon.png)
    newName = newName.toLowerCase();

    // 3. Remove espaços (ex: screenshot mobile.png -> screenshot-mobile.png)
    newName = newName.replace(/\s+/g, '-');

    if (file !== newName) {
        const oldPath = path.join(publicDir, file);
        const newPath = path.join(publicDir, newName);
        
        // Se o arquivo destino já existe (conflito de case), deleta o antigo
        if (fs.existsSync(newPath) && file.toLowerCase() === newName) {
             // Apenas renomeia no mesmo lugar (Windows pode precisar de temp)
             const tempPath = path.join(publicDir, `temp-${Date.now()}-${newName}`);
             fs.renameSync(oldPath, tempPath);
             fs.renameSync(tempPath, newPath);
        } else {
             fs.renameSync(oldPath, newPath);
        }
        
        console.log(`✅ Corrigido: ${file} -> ${newName}`);
        fixedCount++;
    }
});

if (fixedCount === 0) {
    console.log('✨ Nenhuma correção necessária. Seus arquivos parecem corretos!');
} else {
    console.log(`🎉 ${fixedCount} arquivos corrigidos!`);
    console.log('👉 AGORA RODE NO TERMINAL:');
    console.log('   git add public/');
    console.log('   git commit -m "Fix image names"');
    console.log('   git push');
}
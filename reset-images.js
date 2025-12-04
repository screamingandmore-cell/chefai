import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

console.log('🔄 Iniciando padronização de imagens...');

if (!fs.existsSync(publicDir)) {
    console.error('❌ Pasta public não encontrada!');
    process.exit(1);
}

// Ler arquivos
const files = fs.readdirSync(publicDir).filter(f => f.toLowerCase().endsWith('.png'));

let screenCount = 1;

files.forEach(file => {
    const oldPath = path.join(publicDir, file);
    let newName = file.toLowerCase();

    // Preservar Ícones (se tiver 192 ou 512 no nome)
    if (file.includes('192')) {
        newName = 'icon-192.png';
    } else if (file.includes('512')) {
        newName = 'icon-512.png';
    } 
    // Renomear Screenshots sequencialmente
    else {
        newName = `screen-${screenCount}.png`;
        screenCount++;
    }

    const newPath = path.join(publicDir, newName);

    // Renomear apenas se o nome for diferente
    if (file !== newName) {
        // Evitar sobrescrever se já existe (no Windows rename direto pode falhar se mudar só case)
        if (fs.existsSync(newPath) && file.toLowerCase() !== newName) {
            console.log(`⚠️ Pulei ${file} pois ${newName} já existe.`);
        } else {
            try {
                fs.renameSync(oldPath, newPath);
                console.log(`✅ ${file} -> ${newName}`);
            } catch (e) {
                console.error(`Erro ao renomear ${file}:`, e);
            }
        }
    }
});

console.log('🎉 Imagens padronizadas! Agora faça o git add/commit/push.');
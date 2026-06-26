const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '.genkit/templates');
const destDir = path.resolve(__dirname, 'lib/templates');

console.log(`[Copy Templates] Copiando de ${srcDir} para ${destDir}...`);

try {
  if (!fs.existsSync(srcDir)) {
    console.error(`[Copy Templates] Erro: Diretório de origem não encontrado: ${srcDir}`);
    process.exit(0); // Não falha o build, mas avisa
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const files = fs.readdirSync(srcDir);
  let count = 0;
  for (const file of files) {
    if (file.endsWith('.md')) {
      fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
      count++;
    }
  }
  console.log(`[Copy Templates] Sucesso! ${count} templates copiados.`);
} catch (err) {
  console.error('[Copy Templates] Falha ao copiar templates:', err);
}

import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const root = 'dist';
async function filesAt(folder) {
  const output = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) output.push(...await filesAt(path));
    else output.push(path);
  }
  return output;
}
const files = await filesAt(root);
const isOriginalDemo = (path) => path.replaceAll('\\', '/') === 'dist/audio/woodstock-demo-v1.wav';
const forbidden = files.filter((path) => !isOriginalDemo(path) && /(?:source-art|vendor-skills|SKILL\.md|\.env|\.(?:mp3|wav|flac|zip|ts|map)$)/iu.test(path));
if (forbidden.length) throw new Error(`Conteúdo indevido no build: ${forbidden.join(', ')}`);
const html = await readFile(join(root, 'index.html'), 'utf8');
for (const marker of ['lang="pt-BR"', 'name="description"', 'property="og:image"', 'id="presave-dialog"', 'id="colecao"']) {
  if (!html.includes(marker)) throw new Error(`HTML incompleto: ${marker}`);
}
const bytes = (await Promise.all(files.map(async (path) => (await stat(path)).size))).reduce((sum, size) => sum + size, 0);
console.log(`Build estático verificado: ${files.length} arquivos, ${bytes} bytes. Somente WAV demonstrativo permitido; sem masters, fontes originais, skills, ZIPs ou sourcemaps.`);

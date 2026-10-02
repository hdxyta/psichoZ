// Full-frame derivative only. Keep the supplied PNG outside the public build.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const source = new URL('../source-art/Mapa Neon de Inferno Cibernético.png', import.meta.url);
const output = new URL('../public/games/tower/inferno-map.webp', import.meta.url);
const result = await sharp(fileURLToPath(source))
  .resize({ width: 1536, withoutEnlargement: true })
  .webp({ quality: 92, smartSubsample: true, effort: 6 })
  .toFile(fileURLToPath(output));
console.log(`Woodstock map: ${result.width} × ${result.height}, ${result.size} bytes`);

const towerAssets = [
  ['Woodstock Torre Agulha.png', 'tower-needle.webp'],
  ['Woodstock Corrente Lenta.png', 'tower-chain.webp'],
  ['Woodstock Torre Olho.png', 'tower-orb.webp'],
  ['Woodstock Torre Portal.png', 'tower-portal.webp'],
];

for (const [input, file] of towerAssets) {
  const towerSource = new URL(`../source-art/${input}`, import.meta.url);
  const towerOutput = new URL(`../public/games/tower/${file}`, import.meta.url);
  const tower = await sharp(fileURLToPath(towerSource))
    .resize({ width: 180, height: 180, fit: 'contain', withoutEnlargement: true })
    .webp({ quality: 88, smartSubsample: true, effort: 6 })
    .toFile(fileURLToPath(towerOutput));
  console.log(`Woodstock tower ${file}: ${tower.width} × ${tower.height}, ${tower.size} bytes`);
}

const minionAssets = [
  ['Woodstock Minion Basic.png', 'minion-basic.webp'],
  ['Woodstock Minion Morcego.png', 'minion-bat.webp'],
  ['Woodstock Minion Mago.png', 'minion-mage.webp'],
  ['Woodstock Minion Leao.png', 'minion-lion.webp'],
  ['Woodstock Minion Boss.png', 'minion-boss.webp'],
];

for (const [input, file] of minionAssets) {
  const minionSource = new URL(`../source-art/${input}`, import.meta.url);
  const minionOutput = new URL(`../public/games/tower/${file}`, import.meta.url);
  const minion = await sharp(fileURLToPath(minionSource))
    .resize({ width: 220, height: 220, fit: 'contain', withoutEnlargement: true })
    .webp({ quality: 88, smartSubsample: true, effort: 6 })
    .toFile(fileURLToPath(minionOutput));
  console.log(`Woodstock minion ${file}: ${minion.width} × ${minion.height}, ${minion.size} bytes`);
}

const shotAssets = [
  ['Woodstock Shot Red Sheet.png', 'shot-red.webp'],
  ['Woodstock Shot White Sheet.png', 'shot-white.webp'],
];

for (const [input, file] of shotAssets) {
  const shotSource = new URL(`../source-art/${input}`, import.meta.url);
  const shotOutput = new URL(`../public/games/tower/${file}`, import.meta.url);
  const shot = await sharp(fileURLToPath(shotSource))
    .resize({ width: 768, withoutEnlargement: true })
    .webp({ quality: 88, smartSubsample: true, effort: 6 })
    .toFile(fileURLToPath(shotOutput));
  console.log(`Woodstock shot ${file}: ${shot.width} × ${shot.height}, ${shot.size} bytes`);
}

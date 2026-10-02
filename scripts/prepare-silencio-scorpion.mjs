import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
const files={
  'Imagem do ChatGPT 2 de out. de 2026, 16_42_11-1.png':'walk',
  'Imagem do ChatGPT 2 de out. de 2026, 16_42_13-2.png':'attack',
  'Imagem do ChatGPT 2 de out. de 2026, 16_42_14-3.png':'combo',
  'Imagem do ChatGPT 2 de out. de 2026, 16_42_15-4.png':'guard',
  'Imagem do ChatGPT 2 de out. de 2026, 16_42_16-5.png':'special',
  'Folha de Sprites_ Salto do Escorpião Monstruoso.png':'jump',
};
await Promise.all(Object.entries(files).map(([source,name])=>sharp(fileURLToPath(new URL(`../source-art/${source}`,import.meta.url))).webp({quality:94}).toFile(fileURLToPath(new URL(`../public/games/brawler/scorpion-${name}.webp`,import.meta.url)))));

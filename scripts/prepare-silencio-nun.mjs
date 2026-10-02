import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
const files={
  'Imagem do ChatGPT 2 de out. de 2026, 16_52_37-1.png':'walk',
  'Imagem do ChatGPT 2 de out. de 2026, 16_52_38-2.png':'attack',
  'Imagem do ChatGPT 2 de out. de 2026, 16_52_39-3.png':'run-fire',
  'Imagem do ChatGPT 2 de out. de 2026, 16_52_41-4.png':'guard',
  'Imagem do ChatGPT 2 de out. de 2026, 16_52_42-5.png':'special',
  'Imagem do ChatGPT 2 de out. de 2026, 16_52_43-6.png':'explosion',
  'Imagem do ChatGPT 2 de out. de 2026, 16_52_44-7.png':'shot',
  'Sprite Sheet da Freira Fumante em Salto.png':'jump',
};
await Promise.all(Object.entries(files).map(([source,name])=>sharp(fileURLToPath(new URL(`../source-art/${source}`,import.meta.url))).webp({quality:94}).toFile(fileURLToPath(new URL(`../public/games/brawler/nun-${name}.webp`,import.meta.url)))));

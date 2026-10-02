import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
const files={
  '17_25_12-1':'walk','17_25_13-2':'jump','17_25_14-3':'attack',
  '17_25_15-4':'guard','17_25_16-5':'special','17_25_17-6':'magic','17_25_18-7':'fire',
};
await Promise.all(Object.entries(files).map(([suffix,name])=>sharp(fileURLToPath(new URL(`../source-art/Imagem do ChatGPT 2 de out. de 2026, ${suffix}.png`,import.meta.url))).webp({quality:94}).toFile(fileURLToPath(new URL(`../public/games/brawler/wing-${name}.webp`,import.meta.url)))));

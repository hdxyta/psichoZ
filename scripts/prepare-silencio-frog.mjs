import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
const sources=['Imagem do ChatGPT 2 de out. de 2026, 16_12_11-1.png','Imagem do ChatGPT 2 de out. de 2026, 16_12_12-2.png','Imagem do ChatGPT 2 de out. de 2026, 16_12_13-3.png','Imagem do ChatGPT 2 de out. de 2026, 16_12_14-4.png','Imagem do ChatGPT 2 de out. de 2026, 16_12_15-5.png','Sprites do sapo chifrudo saltando.png'];
const states=['walk','attack','combo','guard','special','jump'];
await Promise.all(sources.map((source,i)=>sharp(fileURLToPath(new URL(`../source-art/${source}`,import.meta.url))).webp({quality:94}).toFile(fileURLToPath(new URL(`../public/games/brawler/frog-${states[i]}.webp`,import.meta.url)))));

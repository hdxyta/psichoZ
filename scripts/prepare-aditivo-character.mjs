import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const assets = {
  'Mapa Gótico do Cemitério em Ruínas.png':'cemetery',
  'Moldura de dano em vermelho carmesim.png':'damage-frame',
  'Sprite Sheet da Freira Sombria.png':'nun',
  'psichoz_freira_shotgun_spritesheet.png':'shotgun',
  'psichoz_freira_faca_spritesheet.png':'knife',
  'psichoz_freira_bastao_magico_spritesheet.png':'staff',
  'Imagem do ChatGPT 2 de out. de 2026, 14_38_50-1.png':'fx-shotgun',
  'Atlas de efeitos de golpes vermelhos e negros.png':'fx-knife',
  'Imagem do ChatGPT 2 de out. de 2026, 14_38_51-2.png':'fx-staff',
};
await Promise.all(Object.entries(assets).map(([source,name])=>
  sharp(fileURLToPath(new URL(`../source-art/${source}`,import.meta.url)))
    .webp({quality:92}).toFile(fileURLToPath(new URL(`../public/games/zombie/${name}.webp`,import.meta.url)))
));

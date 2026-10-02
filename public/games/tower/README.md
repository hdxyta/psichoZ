# Woodstock tower defense

Tower defense local para `track-01`, criado para o psicoZ.

Objetivo: construir torres nos sigilos e sobreviver a cinco ondas antes que a torre principal perca todo o sinal.

Controles:

- Clique ou toque em um sigilo para construir a torre selecionada.
- `1` seleciona Torre agulha.
- `2` seleciona Corrente lenta.
- `Espaco` ou `Enter` chama a proxima onda.
- `Tab` navega pelos sigilos; `Enter` ou `Espaco` constroi no sigilo focado.

O jogo usa apenas Canvas e a ponte local `../shared.js`; nao carrega assets externos.

## Mapa Inferno Cibernético

Arte fornecida pelo usuário, preservada em `source-art/Mapa Neon de Inferno Cibernético.png`.
O mapa usa `inferno-map-animated.svg` como camada leve de brilho animado e `inferno-map.webp`
como reserva estatica (1536 × 1024), derivado sem recorte ou alteração de cor.
As torres dos seletores usam `tower-needle.webp` e `tower-chain.webp`, geradas a partir dos PNGs preservados em `source-art/`.
Depois da onda 5, `tower-orb.webp` e `tower-portal.webp` entram nos seletores como torres avancadas.
Os minions usam `minion-basic.webp`, `minion-bat.webp`, `minion-mage.webp`, `minion-lion.webp` e `minion-boss.webp`,
tambem derivados de originais preservados em `source-art/`.
Os tiros usam `shot-red.webp` e `shot-white.webp`, spritesheets 4 × 3 animadas no Canvas.
Regerar mapa, torres, minions e tiros com `node scripts/prepare-woodstock-map.mjs`.

Canvas e layout mantêm a proporção 3:2. Inimigos seguem o centro da estrada desenhada,
da entrada à esquerda até o portal à direita. Doze sigilos ficam fora da estrada;
quatro deles começam lacrados e cobram sinal antes de aceitar uma torre.
Seus botões aceitam teclado, mouse e toque. Recursos ficam fora da arte.
Se as imagens falharem, o mesmo percurso é desenhado em Canvas e a partida continua.

Ondas:

- Onda 1: somente minion basico.
- Onda 2: basicos e morcegos menores e mais rapidos.
- Onda 3: adiciona magos, que se movem em velocidade intermediaria e disparam devagar.
- Onda 4: adiciona leoes maiores e mais lentos.
- Onda 5: adiciona o boss, maior e mais lento de todos.

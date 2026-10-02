# Aditivo zombie rounds

Top-down local para `track-02`, criado para o psicoZ.

Objetivo: sobreviver a quatro rounds de zumbis. Ao fim de cada round, o jogador escolhe uma carta de recompensa que melhora algum artificio: cadencia, dano, velocidade, cura, dash ou perfuracao.

Controles:

- `WASD` ou setas movem.
- Mouse/toque define a mira.
- Clique ou toque dispara.
- `Shift` ou botao Dash faz uma esquiva curta.

O jogo usa apenas Canvas e a ponte local `../shared.js`; nao carrega assets externos.

Os inimigos usam `zombies-neon.png`, com 13 quadros de caminhada para cada uma das quatro direções. As diagonais mantêm a direção anterior perto do limite para evitar tremulação. Os recortes respeitam os centros irregulares da folha e excluem a coluna de legendas; são preparados uma vez no carregamento. As demais linhas (ataque, dano, morte e idle) ficam reservadas para integração futura. O original está em `source-art/`.

Sprites, colisões e mira compartilham as coordenadas lógicas 960 × 540, com escala proporcional por CSS e controles de toque. Se a imagem falhar, os inimigos continuam visíveis com o desenho de fallback.

## Freira e armas

## Cemitério e colisões

`cemetery.webp` usa o mapa original preservado em `source-art/`. `cemetery.js` marca as bases dos muros da igreja, cercas do cemitério e muros junto às ruas em coordenadas da arte. As portas são intervalos livres na geometria; lápides, bancos e vegetação são decoração. O mapa permanece fixo enquanto as cartas ampliam a área liberada, até os limites da imagem, sem esticar ou deslocar os muros.

Freira e zumbis têm corpos circulares de raio 12. Movimento, dash, separação e empurrão da faca usam passos de até 4 unidades para evitar atravessar paredes. A separação resolve contatos entre todos os personagens; o dano continua ao encostar. A navegação usa uma grade de 16 unidades com folga nas paredes e um campo compartilhado atualizado a cada 0,3 segundo; a geometria da grade é reaproveitada entre atualizações. Spawns e drops são escolhidos em posições alcançáveis. Muros bloqueiam projéteis e golpes da faca. Na ausência da imagem, os muros continuam desenhados e colidindo.

A arena cresce 8% das dimensões originais a cada três cartas. A câmera afasta suavemente nas cartas 3, 6 e 9 (escala mínima 1/1,24). Depois mantém essa escala e acompanha a personagem dentro dos limites da arena, que continua crescendo. Mira por mouse/toque usa a transformação inversa da câmera; colisões, drops e spawns usam coordenadas do mundo. HUD e moldura de dano permanecem fixos na tela.

A personagem começa sem arma. A escolha de cartas (incluindo a primeira) libera drops na carta 1 (faca de exército), 3 (shotgun) e 8 (cajado). A arma cai perto da personagem, dentro da arena, e só é equipada por proximidade após pousar. Drops antigos não substituem uma arma superior. A partida continua após a conquista de quatro rounds, permitindo alcançar o cajado sem alterar o critério da conquista.

Faca: arco de curto alcance e empurrão. Shotgun: cinco projéteis em leque e alcance curto. Cajado: projétil mágico com perfuração. Um projétil não pode causar dano repetido no mesmo inimigo. As cartas de dano e cadência funcionam com todas as armas. Mouse/toque mira e ataca; F ou o botão Atacar mantém ataques mirando o inimigo mais próximo, compatível com os botões de movimento.

`character.js` contém recortes por asset, excluindo legendas e FX embutidos. As folhas não são ciclos uniformes de todas as direções: a linha WALK DOWN original inclui vistas de costas na segunda metade; a shotgun perde a arma em várias poses e a linha WALK do cajado inclui facas. Foram selecionadas poses coerentes com movimento vertical leve onde falta caminhada armada. Ataques laterais usam os quadros próprios; nas direções verticais a pose é mantida e o efeito acompanha a mira. Não são animações completas em oito direções. Efeitos separados de corte, disparo e magia são usados no combate; quadros opcionais de recarga não criam uma mecânica de munição.

Originais e manifesto ficam em `source-art/`; versões WebP de execução são geradas com `node scripts/prepare-aditivo-character.mjs`. Validação: build, testes unitários de marcos/coleta, testes E2E de coleta real, fallback e escala, e atlas visual de direções. Emulação móvel não comprova aparelho físico.

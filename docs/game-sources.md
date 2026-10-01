# Fontes dos 15 jogos — 30/09/2026

O psicoZ incorpora **15 bases executáveis de jogos diferentes** e as adapta à paleta preto/papel/vermelho, sombras hachuradas, controles de navegador e conquistas locais. Código de regras foi copiado para `public/games/`, com origem e licença preservadas; não se trata apenas de referências conceituais. Os arquivos originais revisados ficam em `docs/vendor-games/`, fora do build.

A matriz abaixo combina [fontes de ação](game-sources-action.json), [fontes de puzzles](game-sources-puzzles.json), [demais fontes](game-sources-misc.json) e o exemplo Untangle, cuja [revisão](vendor-games/makzan/COMMIT.txt) e [README](vendor-games/makzan/readme.md) estão preservados. O catálogo executável fica em `src/data/vendor-games.ts` e as condições de vitória estão em [GAME_SYSTEM.md](GAME_SYSTEM.md).

## Revisões e licença

Todos os links de código abaixo apontam para uma revisão fixa. MIT se refere ao código autorizado, observadas as exclusões de assets indicadas.

| Faixa / jogo | Origem e revisão | Licença / evidência preservada | Originais locais |
| --- | --- | --- | --- |
| 01 · Labirinto | [wrksp8/TheLostPath](https://github.com/wrksp8/TheLostPath/tree/767e15d8a1cdb689e0ac56d703ccbe7fde977605) · `767e15d8a1cdb689e0ac56d703ccbe7fde977605` | MIT, licença do repositório | [TheLostPath](vendor-games/wrksp8/TheLostPath/) |
| 02 · Snake | [varshney-himanshu/snake-game-js](https://github.com/varshney-himanshu/snake-game-js/tree/f07a620bf203b9a62837cc154226e72bb324d4e3) · `f07a620bf203b9a62837cc154226e72bb324d4e3` | MIT, licença do repositório | [Snake](vendor-games/varshney-himanshu/snake-game-js/) |
| 03 · Flappy | [pyforgedev/flappy-bird](https://github.com/pyforgedev/flappy-bird/tree/29369e112225c35cd1da77e43cf02aa5ed1408a1) · `29369e112225c35cd1da77e43cf02aa5ed1408a1` | MIT, licença do repositório | [Flappy](vendor-games/pyforgedev/flappy-bird/) |
| 04 · Pong | [jakesgordon/javascript-pong](https://github.com/jakesgordon/javascript-pong/tree/ca3240536e4f79ab7144388e56ed19de715b6662) · `ca3240536e4f79ab7144388e56ed19de715b6662` | MIT; imagens do menu e sons excluídos | [Pong](vendor-games/jakesgordon/javascript-pong/) |
| 05 · Tetris | [jakesgordon/javascript-tetris](https://github.com/jakesgordon/javascript-tetris/tree/e5c0c42f7dac0f3514a55eff656c6e22e95d68ed) · `e5c0c42f7dac0f3514a55eff656c6e22e95d68ed` | MIT; textura e dependência Stats excluídas | [Tetris](vendor-games/jakesgordon/javascript-tetris/) |
| 06 · Memória | [makzan/HTML5-Games-Examples](https://github.com/makzan/HTML5-Games-Examples/tree/646cc1dbfdb5238b36798eec3791a868ede9de2b/css3-matching-game) · `646cc1dbfdb5238b36798eec3791a868ede9de2b` | MIT declarado no README raiz; jQuery com aviso e texto MIT separados | [Memória](vendor-games/memory/) |
| 07 · Racer | [jakesgordon/javascript-racer](https://github.com/jakesgordon/javascript-racer/tree/3e8a060b5900755db27f899612a74a77427c853e) · `3e8a060b5900755db27f899612a74a77427c853e` | **MIT somente código**; arte emprestada de OutRun e música não incorporadas | [Racer](vendor-games/jakesgordon/javascript-racer/) |
| 08 · Untangle | [makzan/HTML5-Games-Examples](https://github.com/makzan/HTML5-Games-Examples/tree/646cc1dbfdb5238b36798eec3791a868ede9de2b/canvas-untangle-game) · `646cc1dbfdb5238b36798eec3791a868ede9de2b` | MIT declarado no README raiz | [Untangle](vendor-games/makzan/canvas-untangle-game/) |
| 09 · Asteroids | [dmcinnes/HTML5-Asteroids](https://github.com/dmcinnes/HTML5-Asteroids/tree/930301cbda83ed3b120f64b801d937d077ee2da0) · `930301cbda83ed3b120f64b801d937d077ee2da0` | MIT; áudio, fonte externa e inicialização jQuery excluídos | [Asteroids](vendor-games/dmcinnes/HTML5-Asteroids/) |
| 10 · Breakout | [jakesgordon/javascript-breakout](https://github.com/jakesgordon/javascript-breakout/tree/eed59e2affa9423b93d2ac8ff93061bb88b33284) · `eed59e2affa9423b93d2ac8ff93061bb88b33284` | **MIT código**, exceção de sons preservada; sons não incorporados | [Breakout](vendor-games/jakesgordon/javascript-breakout/) |
| 11 · Campo minado | [saiuttejr/GameBox](https://github.com/saiuttejr/GameBox/tree/8fd141127a7ad2c5fb718d5a9e4068c5f9af0d4b/minesweeper) · `8fd141127a7ad2c5fb718d5a9e4068c5f9af0d4b` | MIT, `LICENSE.md` | [Campo minado](vendor-games/minesweeper/) |
| 12 · Space Invaders | [dwmkerr/spaceinvaders](https://github.com/dwmkerr/spaceinvaders/tree/5f79c6ae4f3cb1fbda0be5cc5212a3a407fa27ee) · `5f79c6ae4f3cb1fbda0be5cc5212a3a407fa27ee` | MIT; áudio externo, HTML de tracking e starfield excluídos | [Space Invaders](vendor-games/dwmkerr/spaceinvaders/) |
| 13 · Sokoban | [taniarascia/sokoban](https://github.com/taniarascia/sokoban/tree/23ee71c46566506d85445130c78dfae2b6347792) · `23ee71c46566506d85445130c78dfae2b6347792` | MIT, `LICENSE` | [Sokoban](vendor-games/sokoban/) |
| 14 · Simon | [d4vucat/Simon-Game](https://github.com/d4vucat/Simon-Game/tree/a6313ab5614d0a542bda36c88e6121d17cb70dd6) · `a6313ab5614d0a542bda36c88e6121d17cb70dd6` | MIT, licença do repositório | [Simon](vendor-games/d4vucat/Simon-Game/) |
| 15 · 2048 | [gabrielecirulli/2048](https://github.com/gabrielecirulli/2048/tree/478b6ec346e3787f589e4af751378d06ded4cbbc) · `478b6ec346e3787f589e4af751378d06ded4cbbc` | MIT, `LICENSE.txt` | [2048](vendor-games/2048/) |

Avisos dos autores e arquivos de licença também acompanham as versões distribuídas em `public/games/<slug>/`. Makzan é creditado como Thomas Seng Hin Mak/Thomas Mak; os cabeçalhos originais foram preservados, incluindo textos históricos, junto à declaração MIT posterior do README raiz. Não foi inventado um arquivo de licença que o repositório não possui.

O jogo de memória conserva jQuery **1.6**, com aviso original de licença alternativa MIT/GPL e [texto MIT da revisão 1.6](https://github.com/jquery/jquery/blob/1.6/MIT-LICENSE.txt) arquivado localmente. Essa cópia é usada somente no iframe do exemplo; não modifica o ambiente global do site nem adiciona dependência npm. Os demais módulos de interface adotam APIs nativas quando a integração antiga dependia de recursos externos.

## O que foi efetivamente reaproveitado

| Jogo | Regras copiadas e ativas | Adaptação principal |
| --- | --- | --- |
| Labirinto | Geração DFS, busca BFS, movimento/colisão e loop de `src/script.js`. | Mapa 13 × 13, saída alcançável distante, remoção de atalho de debug, correção do primeiro delta e de loops duplicados; controles e renderer local. |
| Snake | Módulos de entidades, jogo, entrada e renderer. | Quadra 16 × 16, seis coletas, swipe e direcional; placar em memória. |
| Flappy | Impulso, movimento dos obstáculos, geração dos vãos, colisão e placar de `flappyBird.js`. | Meta de oito passagens; desenhos Canvas locais substituem bitmaps e áudio. |
| Pong | Física e adversário de `game.js` e `pong.js`. | Três pontos, raquete maior, mouse/toque e setas; menus/demonstração/sons antigos retirados. |
| Tetris | Código inline extraído para `tetris.js`: máscaras, sorteio, rotação, colisão e remoção de linhas. | Meta de duas linhas, botões e queda rápida, hachuras; Stats substituído por operação vazia. |
| Memória | Montagem do baralho, seleção, comparação e pares de `html5games.matchgame.js`. | Seis pares de símbolos locais, cartas como botões, prazo de 120 s, remoção das persistências próprias e de dependência exclusiva de eventos WebKit. |
| Racer | Código de `v4.final.html` e `common.js`: projeção, direção, trânsito, colisão e percurso. | Volta curta, limite de cinco colisões, atlas desenhado por Canvas, relógio e armazenamento da tentativa. |
| Untangle | `untangle.data.js`, `untangle.drawing.js`, `untangle.game.js`, `untangle.levels.js`: grafo, linhas, interseções e níveis. | Renderer local, arraste e seleção por botões/setas; duas redes e exigência de nós separados evitam vitória por sobreposição. |
| Asteroids | `Matrix`, `Sprite`, nave, bala, asteroide, grade de colisão, bordas conectadas e máquina de estados de `game.js`. | Uma onda, geometria vetorial recolorida, início nativo e controles de ponteiro/toque. |
| Breakout | `game.js`, `breakout.js`, `levels.js`: bola, raquete, colisão e quebra. | Fase de 12 blocos, três vidas, coordenadas de ponteiro escaladas, raquete hachurada; som desativado. |
| Campo minado | Posicionamento de minas, primeiro clique seguro, contagem, revelação recursiva, bandeiras e vitória de `script.js`. | 8 × 8 com oito minas, modo bandeira no toque, rótulos acessíveis e restauração de foco. |
| Space Invaders | `Game`, `PlayState`, formação, projéteis, colisão e loop de `spaceinvaders.js`. | Formação de 18, renderer local, correção da referência global ao canvas e controles de toque. |
| Sokoban | `Sokoban.js` e `utils.js` copiados integralmente; movimento, empurrão e restauração de alvos. | Mapa curto em `constants.js`, renderer substituído por `paintCell`, desfazer e contagem real das três caixas nos alvos. |
| Simon | Classe `SimonGame`: reprodução, comparação, timers, erros e progressão. | Quatro rodadas, quatro botões, janela de resposta de 20 s e bloqueio de entrada entre estados. |
| 2048 | `grid.js`, `tile.js`, `keyboard_input_manager.js`, `html_actuator.js`, `game_manager.js`: movimento, fusão, geração e fim. | Alvo explícito **256**, CSS local, botões, swipe e armazenamento somente da tentativa. |

Adapters ligam o estado real das regras à ponte `PsicoZ.report`. As alterações não liberam vitórias por abertura de jogo ou acesso NFC. A infraestrutura comum é da aplicação; cada base continua com sua própria mecânica. Fontes, imagens e músicas externas não são carregadas pelos jogos. Não foram executados scripts de instalação dos repositórios.

## Referências enviadas pelo usuário

- [spbooks/html5games1](https://github.com/spbooks/html5games1/tree/df3c559995eeb694992ef2875c977bc56335eec2), revisão `df3c559995eeb694992ef2875c977bc56335eec2`: exemplos examinados, mas não foi encontrada licença explícita de código na revisão consultada. Nenhum arquivo dessa base foi incorporado.
- [CoolDude2349/Offline-HTML-Games-Pack](https://github.com/CoolDude2349/Offline-HTML-Games-Pack/tree/780484436801ca9bac7a9b7c2fefc95889d70eed), revisão `780484436801ca9bac7a9b7c2fefc95889d70eed`: não foi possível verificar autorização de redistribuição para o pacote e os jogos agregados. Nenhum arquivo dessa coleção foi incorporado.
- [makzan/HTML5-Games-Examples](https://github.com/makzan/HTML5-Games-Examples/blob/646cc1dbfdb5238b36798eec3791a868ede9de2b/readme.md#license): a declaração MIT no README permitiu incorporar **dois** exemplos, memória e Untangle, preservando os avisos. O campo automático de licença do GitHub não substituiu a leitura do README.

Os registros de [22/09](game-example-references.md) descrevem a consulta conceitual anterior. A incorporação efetiva documentada aqui ocorreu na revisão de 30/09, após o pedido explícito de reutilizar bases prontas.

## Verificação local dos quatro puzzles

O script `scripts/verify-vendor-puzzles.mjs` foi executado contra o servidor de desenvolvimento em `http://127.0.0.1:4174`, com Chrome isolado, uma configuração desktop e Pixel 7 emulado. **Oito cenários passaram**, quatro jogos nas duas configurações:

- Memória: 12 cartas, seleção dos pares por ações reais nos botões e vitória. A automação leu os símbolos no DOM para escolher pares; não enviou estado de vitória.
- Sokoban: sequência de movimentos reais por teclado/direcional, três caixas nos alvos e vitória.
- Campo minado: 64 células, primeiro clique seguro e modo de marcação; não foi executada uma partida completa até vitória.
- 2048: duas peças iniciais e movimento por teclas/botões; não foi executada uma partida até 256.

O ensaio tornou o getter de `localStorage` indisponível de propósito. Não houve erro de página, requisição externa ou transbordamento horizontal nos oito cenários. Foram produzidas [oito capturas](screenshots/vendor-puzzles-2026-09-30/); as quatro capturas mobile foram inspecionadas visualmente. Os scripts públicos dos quatro puzzles também passaram por `node --check`.

Esses ensaios diretos verificam somente o escopo descrito. Não substituem o teste do diálogo do álbum, do build final, dos outros 11 jogos, de todas as condições de derrota/pausa nem de aparelho físico. A aprovação final deve citar separadamente as verificações executadas no projeto completo.

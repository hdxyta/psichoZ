# Sistema de jogos do psicoZ

Atualizado em 30/09/2026. O hub `#jogo` oferece **15 jogos de mecânicas distintas**, um por posição do álbum. Esta versão incorpora código de jogos existentes com licença verificada e adapta apresentação, controles, objetivos e integração ao psicoZ. As fontes, commits, licenças e alterações estão em [game-sources.md](game-sources.md).

As rotas continuam de `#/jogar/track-01` a `#/jogar/track-15`, com `level-01` a `level-15`. O título editorial da faixa 15 continua `null`, exibido como “Faixa 15 — título a anunciar”. Nomes dos desafios são ficção da experiência e não uma interpretação aprovada das músicas.

## Catálogo atual

| Faixa | Título da contracapa | Jogo adaptado | Objetivo real da tentativa |
| --- | --- | --- | --- |
| 01 | Woodstock | Labirinto / The Lost Path | Encontrar a saída do labirinto 13 × 13. |
| 02 | Aditivo | Snake | Recolher seis alimentos sem colidir. |
| 03 | Silêncio | Flappy Bird | Atravessar oito passagens sem bater. |
| 04 | Químico | Pong | Marcar três pontos antes do adversário. |
| 05 | Inverso | Tetris | Completar duas linhas antes de atingir o teto. |
| 06 | Conhecida Ilusão | Memória / CSS3 Matching | Encontrar os seis pares. |
| 07 | Não Me Dizem Nada | JavaScript Racer | Completar uma volta antes de acumular cinco colisões. |
| 08 | Sublime | Untangle | Desembaralhar duas redes sem cruzamentos e sem sobrepor os nós. |
| 09 | PsicoZ | Asteroids | Destruir uma onda completa de asteroides. |
| 10 | Psicose feat Nobre | Breakout | Quebrar 12 blocos antes de perder três vidas. |
| 11 | Assumindo o Risco | Campo minado | Revelar as 56 casas seguras do tabuleiro 8 × 8, com oito minas. |
| 12 | Acapella | Space Invaders | Eliminar a formação de 18 invasores. |
| 13 | Cidade Cinza | Sokoban | Empurrar três caixas para os três alvos. |
| 14 | Não Posso Errar | Simon | Repetir quatro rodadas de sinais sem errar. |
| 15 | Título a anunciar | 2048, desafio 256 | Criar um bloco 256 por fusões válidas. |

Cada tentativa tem tempo máximo definido no catálogo. Os limites, mapas e metas foram reduzidos para sessões curtas. Dificuldade, arte adicional e teste em aparelhos físicos continuam sujeitos ao refinamento.

## Arquitetura e carregamento

- `src/data/catalog.ts`: títulos, IDs estáveis, disponibilidade dos 15 níveis e recompensas. Disponibilidade de jogo e publicação de áudio são decisões diferentes.
- `src/data/vendor-games.ts`: associação entre faixa e jogo, objetivo, instruções, duração, título e referência pública da base utilizada.
- `src/ui/game-entry.ts`: gateway do diálogo; valida a faixa, carrega o runtime sob demanda, descarta a sessão anterior e registra a conquista no store central.
- `src/game/vendor/runtime.ts`: menu, timer, pausa, reinício, resultado e ciclo de vida do iframe. O iframe só é criado depois de clicar em **Jogar**.
- `public/games/<slug>/`: entrada HTML local, código copiado e adaptado, adapter quando necessário e avisos/licenças da origem. O código das regras continua executando; não são somente links ou referências conceituais.
- `public/games/shared.js`: ponte de eventos, controles e relógio compartilhado. `public/games/theme.css`: papel, preto e vermelho vivo, contornos, hachuras e sombras sólidas.
- `docs/vendor-games/`: originais consultados, README, evidência de licença e revisão fixa, fora do build. Os manifestos de origem documentam as alterações das cópias públicas.

Os documentos e globais dos jogos ficam separados em iframes. As mensagens verificam janela de origem, mesma origem HTTP, tipo e token da tentativa. Isso evita confundir sessões; não é autenticação nem proteção contra alteração pelo próprio visitante. O iframe usa `allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox` para executar código local revisado e permitir abrir os links de origem/licença por ação do visitante.

As implementações anteriores de Woodstock 3D e das famílias `src/game/arcade/` foram preservadas. As 15 rotas atuais usam o runtime de jogos adaptados, incluindo Woodstock. Os documentos de 21/09 e 22/09 descrevem versões anteriores, não o catálogo atual. A home não precisa carregar Three.js para abrir o seletor.

## Controles, pausa e descarte

O menu explica os controles específicos antes de iniciar. Há teclado e controles de mouse/toque: botões nativos nos tabuleiros, direcional e ações nos jogos de movimento, swipe onde aplicável e posicionamento de raquete/veículo pelo ponteiro. Não se exige captura do mouse para esta versão.

O runtime recebe `playing`, `won` ou `lost`, progresso, total, rótulo e instrução. A ponte pausa `requestAnimationFrame`, timers e o relógio virtual usado por `performance.now()`/`Date.now()`, além de interromper animações CSS e entrada. Código adaptado que dependia de `new Date()` teve sua medição ajustada para esse relógio. `Esc`, `P`, o botão de pausa e ocultar a página suspendem a tentativa. Reiniciar cria outro iframe e outra sessão; fechar remove o iframe, listeners e loop do runtime.

## Conquistas e conteúdo pendente

A conquista só é solicitada quando as regras do jogo informam vitória com progresso completo. O gateway conclui o nível ligado à faixa atual. O estado v2 continua exclusivamente em `psicoz:progress`; as persistências próprias dos jogos foram retiradas ou substituídas por memória da tentativa. IDs e conquistas anteriores são mantidos: trocar a implementação de uma faixa não revoga o nível que já estava concluído.

O hub conta `completedLevelIds`, sem confundir NFC com vitória. Abrir a fase, visitar a URL NFC ou perder não deve concluir um nível. Repetir uma vitória não duplica IDs. A disponibilidade local do jogo não publica a recompensa: MP3, ZIP e masters continuam pendentes enquanto o catálogo não os marcar como publicados. O fallback para storage inválido ou indisponível permanece no store do projeto.

Nenhuma música final do álbum foi publicada. Os exemplos adaptados não dependem de CDNs, fontes remotas, analytics ou músicas dos repositórios. Assets cuja licença não permitia incorporação foram excluídos, em particular a arte/música de Racer e os sons de Breakout. O reset mantém a confirmação e afeta somente a chave do projeto.

## Verificação e limites

Validação deve combinar typecheck, testes de catálogo/acesso/persistência, build e navegador. Um teste de store ou mensagem sintética não comprova vitória jogada. O script `scripts/verify-vendor-puzzles.mjs` registra verificações diretas de quatro jogos, incluindo vitórias por ações da interface em memória e Sokoban; o escopo e suas limitações estão em [game-sources.md](game-sources.md#verificação-local-dos-quatro-puzzles).

O [relatório final de 30/09](verification-github-games-2026-09-30.md) registra build, 173 testes unitários, 84 E2E, a repetição final de 34 cenários, inspeção visual e carregamento. Oito jogos tiveram vitória completa verificada; sete tiveram carregamento e controles verificados, sem partida completa até a vitória. Toque emulado e screenshots não comprovam funcionamento em aparelho físico. Este trabalho não executa deploy, upload ou publicação dos masters.


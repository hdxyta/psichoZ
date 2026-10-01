# Carregamento e renderização — Woodstock

Medição final do jogo em **21/09/2026 às 20:14 UTC**, Chrome 153.0.8010.52, Node **20.20.0**, Windows. Preview de produção em 127.0.0.1:4173, contextos isolados, cache desativado, sem limitação artificial de CPU/rede e sem outros testes concorrentes. Mobile é emulação, não aparelho físico.

## Home preservada no bundle final

`npm run test:performance`: **código 0 no bundle final**, às 20:14:46 UTC, usando Node **24.15.0** e o mesmo Chrome 153.0.8010.52. A home não pediu runtime Three.js, WAV ou fase na abertura/rolagem. Zero erros, avisos e arquivos indevidos. As duas auditorias usaram processos separados, sem concorrência.

| Medida | Desktop 1440 × 1000 | Mobile 393 × 851 / DPR 2,75 |
| --- | ---: | ---: |
| Transferência inicial, documento incluído | 442.291 B | 331.707 B |
| Home após rolagem completa | 804.631 B | 804.631 B |
| LCP inicial | 420 ms | 176 ms |
| CLS | 0 | 0 |

Dados finais em [performance-results.json](performance-results.json); a [amostra anterior à revisão dos controles](performance-home-before-controls-2026-09-21.json) foi preservada. O motor continua em importação dinâmica. Os tempos são amostras locais; não isolam uma comparação estatística entre versões.

## Entrada no jogo

`node scripts/measure-game-performance.mjs`: **código 0 no bundle final**. O script lê recursos e instrumenta chamadas WebGL somente no contexto isolado de teste, sem adicionar hooks ao aplicativo. Clique real na faixa, entrada pelo botão principal, pausa por P, ativação opcional do áudio e saída. No desktop, o modo `mouse` confirmou captura nativa na entrada e ao retomar; nenhum fallback foi usado. No mobile emulado, o modo observado foi `touch`.

| Medida | Desktop | Mobile emulado |
| --- | ---: | ---: |
| Clique até menu pronto | 796 ms | 354 ms |
| Runtime + CSS solicitados ao entrar | 152.879 B | 152.879 B |
| Recursos acumulados até jogar, sem o documento HTML | 920.459 B | 698.441 B |
| Máximo de draw calls/frame na amostra de entrada | 83 | 65 |
| Resolução interna | 1440 × 1000 | 491 × 1063 |
| Mediana de intervalo de frame | 10 ms | 10 ms |
| Percentil 95 de intervalo | 10,2 ms | 10,2 ms |
| Duração da amostra | 3,50 s | 3,51 s |

Amostra estacionária de 351 frames, aproximadamente 100 callbacks de frame por segundo neste ambiente. **Não é evidência de 100 FPS em celular nem garantia de 60/30 FPS durante toda a fase.** O intervalo usa requestAnimationFrame e contagem observada de draw calls; o valor depende da máquina/browser/refresh usados. As metas de aparelhos de referência permanecem pendentes.

Os recursos observados até jogar sem música, excluído o documento HTML, ficaram abaixo de 1 MiB e da meta de 8 MiB para a primeira fase. O total varia com as imagens da home antecipadas pelo navegador. Não há modelos ou texturas remotas; superfícies pequenas são geradas por código e a arte real é um WebP já autorizado.

O início silencioso fez zero pedidos de áudio. Após ativar o som e retomar, o WAV demonstrativo respondeu **206 Partial Content**, resposta normal a um pedido de intervalo do HTMLAudioElement. O arquivo inteiro tem 384.044 B. Zero erros de página/console, e zero canvases após sair. Dados em [performance-woodstock-results.json](performance-woodstock-results.json).

A [medição imediatamente anterior](baselines/woodstock-performance/2026-09-21T20-14-14-695Z/performance-woodstock-results.json) foi preservada antes da atualização, assim como o [relatório anterior](baselines/woodstock-performance/2026-09-21T20-14-14-695Z/performance-woodstock.md). Capturas finais: [desktop](screenshots/woodstock-performance/2026-09-21T20-14-14-695Z/world-desktop.png) e [mobile emulado](screenshots/woodstock-performance/2026-09-21T20-14-14-695Z/world-mobile-emulated.png).

## Bundle e limitações

Build final: 13 arquivos, **1.934.591 B em disco**, incluindo as artes e o WAV de teste. Home `index-BtYUAmOU.js`, CSS `index-D-_uRul1.css`; fase `runtime-CGnwewh0.js`, CSS `runtime-ynmn3yh0.css`. HTML SHA-256: `e46c22f265bf87ca221629bb8ee35c8284f4bd413658f3f00bf76f8b25176e89`, igual ao arquivo medido e ao `dist/index.html` conferido após a execução.

O chunk de jogo tem **578.674 B sem compressão**; sua transferência observada foi de **148.277 B**, e a do CSS da fase foi **4.602 B**. Vite mantém o aviso de tamanho do chunk, que inclui Three.js e é carregado sob demanda; o aviso não foi silenciado nem tratado como erro. Transferência observada inclui a contabilização do navegador e não deve ser confundida com tamanho gzip puro.

Não foram medidos aparelho físico, Safari, rede móvel real, consumo de bateria, INP/TBT, produção ou longa sessão de GPU. Não foram instalados DevTools MCP ou SpectorJS. A [verificação final dos controles](verification-controls-2026-09-21.md) e o [percurso completo](playtest-woodstock.md) complementam estas medições.

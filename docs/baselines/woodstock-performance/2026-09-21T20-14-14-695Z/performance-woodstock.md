# Carregamento e renderização — Woodstock

Medições locais em 21/09/2026, Chrome 153.0.8010.52, Node 24.15.0, Windows. Preview de produção em 127.0.0.1:4173, contextos isolados, cache desativado, sem limitação artificial de CPU/rede. Mobile é emulação, não aparelho físico.

## Home preservada

`npm run test:performance`: código 0. A home não pediu runtime Three.js, WAV ou fase durante a abertura/rolagem. Zero erros, avisos e arquivos indevidos.

| Medida | Desktop 1440 × 1000 | Mobile 393 × 851 / DPR 2,75 |
| --- | ---: | ---: |
| Transferência inicial, documento incluído | 442.292 B | 331.708 B |
| Home após rolagem completa | 804.632 B | 804.632 B |
| LCP inicial | 512 ms | 204 ms |
| CLS | 0 | 0 |

A entrada do jogo e integração acrescentaram 1.581 B transferidos à home comparada à [revisão visual anterior](performance-home-mix-baseline-2026-09-21.json). O motor continua em importação dinâmica. Os tempos são amostras locais; não isolam uma comparação estatística entre versões. Dados completos em [performance-results.json](performance-results.json).

## Entrada no jogo

`node scripts/measure-game-performance.mjs`: código 0. O script lê recursos e instrumenta chamadas WebGL somente no contexto isolado de teste, sem adicionar hooks ao aplicativo. Clique real na faixa, início, pausa, ativação opcional do áudio e saída.

| Medida | Desktop | Mobile emulado |
| --- | ---: | ---: |
| Clique até menu pronto | 859 ms | 317 ms |
| Runtime + CSS solicitados ao entrar | 149.578 B | 149.578 B |
| Recursos acumulados até jogar, sem o documento HTML | 917.160 B | 695.142 B |
| Documento HTML a somar | 4.660 B | 4.660 B |
| Máximo de draw calls/frame na amostra de entrada | 83 | 65 |
| Resolução interna | 1440 × 1000 | 491 × 1063 |
| Mediana de intervalo de frame | 10 ms | 10 ms |
| Percentil 95 de intervalo | 10,1 ms | 10,2 ms |
| Duração da amostra | 3,50 s | 3,50 s |

Amostra estacionária de 351 frames, aproximadamente 100 callbacks de frame por segundo neste ambiente. **Não é evidência de 100 FPS em celular nem garantia de 60/30 FPS durante toda a fase.** O intervalo usa requestAnimationFrame e contagem observada de draw calls; o valor depende da máquina/browser/refresh usados. As metas de aparelhos de referência permanecem pendentes.

O fluxo observado ficou abaixo de 1 MiB até jogar sem música e abaixo da meta de 8 MiB para a primeira fase. Varia com as imagens da home antecipadas pelo navegador. Não há modelos ou texturas remotas; superfícies pequenas são geradas por código e a arte real é um WebP já autorizado.

O início silencioso fez zero pedidos de áudio. Após ativar o som e retomar, o WAV demonstrativo respondeu **206 Partial Content**, resposta normal a um pedido de intervalo do HTMLAudioElement. O arquivo inteiro tem 384.044 B. Zero erros de página/console, e zero canvases após sair. Dados em [performance-woodstock-results.json](performance-woodstock-results.json).

## Bundle e limitações

Build final: 13 arquivos, **1.920.491 B em disco**, incluindo as artes e o WAV de teste. Home `index-BnF4JmDT.js`, CSS `index-D-_uRul1.css`; fase `runtime-DVm0Jy0z.js`, CSS `runtime--vzynOZp.css`. HTML SHA-256: `e5a2f49e61efe25ce9657a2af56c039f1fdc11426f3b7aaa06c398270ea96657`.

Vite emitiu aviso pelo chunk de jogo de **573,35 kB sem compressão** (aproximadamente 147,45 kB gzip). Ele é carregado sob demanda e inclui Three.js; o aviso não foi silenciado nem tratado como erro. O peso inicial e a separação foram medidos antes de considerar mudanças de arquitetura.

Não foram medidos aparelho físico, Safari, rede móvel real, consumo de bateria, INP/TBT, produção ou longa sessão de GPU. Não foram instalados DevTools MCP ou SpectorJS. [Inspeção visual e playtest](verification-woodstock.md) complementam estas medições.

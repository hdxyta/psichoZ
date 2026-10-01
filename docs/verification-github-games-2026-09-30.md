# Verificação dos 15 jogos incorporados — 30/09/2026

As 15 rotas usam jogos diferentes com código de repositórios incorporado e adaptado. O mapa, os objetivos e a arquitetura estão em [GAME_SYSTEM.md](GAME_SYSTEM.md); revisões, licenças, arquivos copiados e exclusões estão em [game-sources.md](game-sources.md). As implementações anteriores foram preservadas, mas não atendem às rotas atuais.

## Verificações executadas

| Verificação | Resultado e alcance |
| --- | --- |
| `npm run typecheck` | Aprovado. |
| `npm test -- --configLoader native --pool=threads --maxWorkers=1` | 173 testes aprovados, em 10 arquivos. Inclui catálogo, acesso, persistência e regras preservadas das versões anteriores; não são 173 partidas dos jogos novos. |
| `node --check` nos scripts de `public/games/` | 52 arquivos JavaScript aprovados. |
| `npm run build -- --configLoader native` | Aprovado; 18 módulos transformados. Carregamento do runtime de jogos por importação dinâmica. |
| `npm run check:build` | Aprovado: 112 arquivos, 1.875.698 bytes. Sem masters, originais de exemplos, fontes de skills, ZIPs inéditos ou sourcemaps. O áudio de demonstração preexistente permanece no build, mas os novos jogos não o solicitam. |
| `npm run test:e2e -- --workers=2 --output=test-results-final-vendor` | 84 testes aprovados em 58,3 s, cobrindo a home e as rotas atuais em desktop e Pixel 7 emulado. |
| `npx playwright test tests/e2e/vendor-games.spec.ts --workers=2 --output=test-results-vendor-final-smoke` | 34 testes aprovados em 31,2 s após o build final, incluindo os últimos ajustes visuais, propagação de movimento reduzido e abertura dos links de licença. Não se apresenta esta repetição como outra execução dos 84 testes. |

Vite, workers e Chromium encontraram `spawn EPERM` no sandbox. As repetições pelo fluxo autorizado de subprocessos funcionaram, sem mudar configurações globais nem dependências. Os testes E2E das versões retiradas das rotas foram conservados em `tests/legacy-e2e/`, com explicação de seu alcance histórico.

## Partidas e integração

Todos os 15 jogos foram carregados e tiveram entradas verificadas em navegador desktop e celular emulado, sem erro de página ou requisição externa nos cenários observados. A suíte verifica isolamento da sessão, pausa do relógio, reinício, descarte ao sair e ausência de conquista por simples abertura/NFC. Mensagens inválidas são ignoradas; isso não é proteção contra adulteração pelo próprio visitante.

Vitórias completas foram verificadas por entradas de jogo, sem disparar artificialmente o callback de conquista, em **oito jogos**:

- Labirinto: percurso até a saída.
- Snake: seis alimentos coletados por movimentos válidos, em desktop e celular emulado.
- Tetris: duas linhas montadas com as peças, em desktop e celular emulado.
- Memória: seis pares selecionados pela interface, em desktop e celular emulado.
- Untangle: dois tabuleiros resolvidos por arraste, com conquista salva e restaurada no reload.
- Asteroids: asteroides e fragmentos destruídos por mira e disparos.
- Sokoban: três caixas empurradas aos alvos, em desktop e celular emulado.
- Simon: quatro sequências observadas e repetidas pela interface.

**Vitória completa ainda não verificada:** Flappy, Pong, Racer, Breakout, campo minado, Space Invaders e 2048. Nestes sete jogos os testes cobrem carregamento e controles; Flappy também teve derrota real observada, Invaders teve acerto/pontuação, campo minado teve abertura segura e marcação, e 2048 teve movimentos/fusões. Isso não equivale a comprovar o percurso completo até a vitória.

## Inspeção visual e correções

Capturas atuais de desktop e celular estão em [screenshots/github-games-2026-09-30](screenshots/github-games-2026-09-30/). Houve inspeção visual das telas, incluindo Tetris, Racer, labirinto, Breakout, 2048, Simon e memória. Evidências adicionais dos puzzles estão em `docs/screenshots/vendor-puzzles-2026-09-30/` e dos jogos de ação em `output/playtest/classics-misc/`.

Foram corrigidos o relógio que podia divergir durante a pausa, a entrada de toque herdada de Breakout e a ordem de desenho do Snake: a cabeça podia ficar encoberta ao crescer. O primeiro teste completo detectou este último problema; a repetição dos 84 testes passou após a correção. Os títulos Químico e Sublime foram conferidos na arte real da contracapa. A faixa 15 continua sem título aprovado.

## Carregamento

`scripts/measure-performance.mjs` foi executado contra o preview local com Chromium isolado e cache desativado. O registro [performance-results.json](performance-results.json) corresponde ao build anterior aos últimos ajustes pequenos de texto/estilo e flags do iframe, não a uma medição nova do build final.

| Perfil | Transferência inicial | LCP | CLS |
| --- | ---: | ---: | ---: |
| Desktop | 446.004 bytes | 524 ms | 0 |
| Pixel 7 emulado | 335.420 bytes | 256 ms | 0 |

O carregamento da home não inclui os 15 motores de jogo: o iframe e seus arquivos são solicitados somente ao iniciar a tentativa selecionada. A transferência após rolar a home foi de 668.022 bytes nos dois perfis. São números de laboratório em localhost, sem limitação de CPU/rede; não representam celular físico, rede móvel ou Core Web Vitals de visitantes reais. Não havia DevTools MCP disponível; a coleta usou Playwright, PerformanceObserver e CDP existentes.

## Limitações e pendências

- Nenhum aparelho físico foi testado. Dificuldade, duração, arte adicional e sensação dos controles ainda precisam de refinamento com partidas humanas.
- As bases antigas foram adaptadas e revisadas no escopo dos arquivos utilizados; não houve auditoria abrangente de todos os repositórios de origem.
- Música final, créditos pendentes, título 15 e downloads continuam sem publicação. Ganhar registra progresso local e não inventa arquivos disponíveis.
- Não houve deploy, upload, commit, push, PR, configuração global ou conexão de MCP.

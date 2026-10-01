# Woodstock — primeira versão jogável

Entrega 2 autorizada em 21/09/2026. O usuário associou a fase 1 a Woodstock e escolheu o labirinto de concreto, grades e correntes. Home e arte preservadas, sem implementar as demais 14 fases, deploy ou upload de masters. AGENTS.md e configurações globais/MCP permaneceram intactos.

## O que funciona

FPS em Three.js por importação dinâmica: movimento e câmera, colisões, grades/paredes bloqueando tiros e ataques, emissor de pulso, uma sentinela, três símbolos, saída, vitória, derrota e reinício. Teclado/mouse e toque, pausa, mapa, sensibilidade, movimento reduzido e áudio opcional com volumes separados. Perda de captura do mouse, foco e visibilidade pausam a sessão. WebGL indisponível/perdido oferece saída útil; arte e áudio ausentes não impedem continuar sem eles.

Woodstock aparece na primeira posição da home, com acesso à fase. A vitória persiste track-01, level-01 e símbolos no armazenamento existente, mantendo NFC independente. A coleção confirma a conquista, porém o MP3 continua “Em breve”; não há download fictício.

O áudio original não foi fornecido. O som disponibilizado é uma textura demonstrativa original, criada localmente e identificada como teste. Permanece desativado até a escolha explícita do visitante.

## Evidências executadas

| Comando/verificação | Resultado |
| --- | --- |
| Instalação local `three@0.186.0` e `@types/three@0.186.0`, versões exatas e `--ignore-scripts` | Código 0; npm reportou zero vulnerabilidades. Nenhum instalador de skill foi executado. |
| `npm run typecheck` | Código 0; também integrado ao build final. |
| `npm test` | **79 testes aprovados**, 4 arquivos. Inclui 16 casos da simulação. |
| `npm run build` | Código 0. Aviso de chunk de jogo >500 kB sem compressão, descrito no relatório de performance. |
| `npm run check:build` | Código 0; 13 arquivos/1.920.491 B. Apenas o WAV original de teste permitido; sem masters ou fontes de skills. |
| Regressão Playwright | **57 casos únicos aprovados, 3 omitidos por modalidade**, em execuções complementares. Os três skips separam captura de mouse desktop e gestos exclusivos de toque. |
| Playtest completo por UI/teclado | Percurso real concluído, três símbolos, saída, coleção e reload. Nenhuma injeção de vitória/posição/progresso. |
| CLI Playwright isolado | Entrada, pausa e inspeção de screenshots/console; zero erros/avisos na sessão normal. |
| `node scripts/measure-game-performance.mjs` | Código 0; fase sob demanda, áudio somente após opt-in, recursos liberados ao sair. |
| `npm run test:performance` | Código 0; home sem downloads de jogo/áudio, CLS 0 e zero erros/avisos. |

A regressão inicial completa executou 56 casos (54 aprovados, 2 skips). Casos adicionais de captura real do mouse e eventos de foco/visibilidade executaram 3 aprovações e 1 skip novos, com revisão do caso de menu. O último ajuste exclusivamente visual, para manter o emissor no quadro em retrato, recebeu novo build, typecheck, medição e capturas responsivas. O arquivo `tests/e2e/game.spec.ts` contém o conjunto reproduzível atual.

Os casos de regressão preservam home, pré-save, foco/fechamento, coleção/NFC/reload, storage inválido ou bloqueado, reset, movimento reduzido e retry de imagem. Os novos verificam load sob demanda, silêncio inicial, entrada por teclado/toque, pausa/reinício/reentrada, perda real de pointer lock e contexto WebGL, fallback WebGL, imagens/áudio 404 e ajustes acessíveis. Eventos blur/visibilidade são simulados no teste: não se afirma Alt-Tab físico.

## Percurso e inspeção visual

O playtest com rota conhecida completou a alternativa oeste sem enfrentar a sentinela, terminou com 100 de integridade e manteve a conquista após reload: **47,6 s de execução**, aproximadamente 39,2 s de teclas mantidas. Uma tentativa anterior de confronto terminou em derrota real e foi preservada. A simulação unitária também percorre ambas as rotas e derrota o inimigo com três disparos por inputs. Não se confunde teste de simulação com a travessia no navegador.

[Relatório e capturas do percurso](playtest-woodstock.md). A duração pretendida de 2–4 minutos de primeira exploração **ainda não foi validada com jogador humano**. A rota conhecida automatizada é mais curta.

Capturas abertas e inspecionadas: entrada, cenário vivo, pausa, mapa, três símbolos, recompensa e coleção; desktop, celular em retrato e paisagem. A revisão corrigiu piso excessivamente escuro, arma grande no desktop, enquadramento da arma em retrato e legenda da saída após os três símbolos.

- [Mundo final desktop](screenshots/woodstock-2026-09-21/final-world-desktop.png)
- [Mundo final mobile emulado](screenshots/woodstock-2026-09-21/final-world-mobile-emulated.png)
- [Paisagem](screenshots/woodstock-2026-09-21/game-playing-mobile-landscape.png)
- [Vitória real](screenshots/woodstock-playtest-2026-09-21/2026-09-21T19-50-54-997Z/victory.png)

## Skills, diagnósticos e limites

Lidas e aplicadas: `web-game-foundations`, `three-webgl-game`, `game-ui-frontend` e `game-playtest` do Game Studio, com pacote/referências preservados no commit registrado; `playwright-cli`, `web-perf`, `systematic-debugging` e `verification-before-completion` já disponíveis localmente foram reutilizadas. Nenhuma alegação de plugin conectado ou instalação global. [Registro](skills-registry.md), [arquitetura](game-architecture.md) e [direção de arte](game-art-direction.md).

Falhas tratadas: ausência de cache npm (consulta/instalação local de rede autorizada), EPERM de subprocessos (fluxo de autorização, sem alterar sandbox global), tipagem de mock em teste, expectativas antigas de copy e problemas visuais reproduzidos em screenshots. Nenhuma falha de gameplay foi “corrigida” fabricando progresso ou removendo testes.

Não foram avaliados dispositivo móvel físico, Safari, leitor de tela, audição humana do arquivo demonstrativo ou balanceamento com jogadores. A inspeção de viewport não comprova desempenho de celular. Música Woodstock, créditos e publicação continuam pendentes. [Medições e condições](performance-woodstock.md).

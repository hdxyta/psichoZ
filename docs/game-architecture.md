# Woodstock — arquitetura da fase 1

O pedido de 21/09/2026 autoriza iniciar a Entrega 2 após a revisão da home. Woodstock é associada à primeira posição/fase; a preferência visual confirmada é **labirinto de concreto, grades e correntes**. A narrativa continua sendo uma proposta de gameplay, não uma descrição oficial da música.

## Limites

| Camada | Responsabilidade |
| --- | --- |
| `src/game/level.ts` | Uma fase por dados: limites, paredes, grades, símbolos, saída e patrulha. |
| `src/game/model.ts`, `simulation.ts` | Estado serializável, colisões, movimento, tiro, dano, coleta, vitória e derrota. Sem DOM/Three.js/storage. |
| `src/game/input.ts` | WASD/setas/mouse/toque convertidos em ações; multitouch separado; pausa, pointer lock e fallback. |
| `src/game/renderer.ts` | Cena Three.js, câmera, materiais, geometria, arte real, resolução e descarte. Nenhuma regra de conquista. |
| `src/game/runtime.ts`, `styles.css` | Único loop, HUD DOM, menus, pausa, reinício, som, transições e notificação de vitória. |
| `src/game/audio.ts` | Música via HTMLAudioElement; efeitos breves via Web Audio. Opt-in, volumes separados, pausa e descarte. |
| `src/ui/game-entry.ts` | Ponte leve com a home e importação dinâmica. Deep link explícito `#/jogar/track-01`. |
| `src/state/progress.ts` | Conquista idempotente após evento real de vitória; chave/versionamento/fallback anteriores preservados. |

Three.js **0.186.0** e tipos **0.186.0**, versões fixas no lockfile. Instalação local com `--ignore-scripts`; sem Rapier, React, GLB, backend ou ferramentas globais. A leitura das skills não criou dependência de runtime. `AGENTS.md` foi preservado; o pedido posterior satisfaz sua condição para iniciar o jogo.

## Regras e ciclo de vida

Unidade: metro; X/Z no chão, Y para cima. Yaw zero olha para −Z; yaw positivo olha para −X. Entrada angular é delta em radianos por frame. Movimento normalizado, colisão circular contra retângulos e limites; substeps de no máximo 1/60 s. O runtime limita delta a 50 ms e a simulação também limita deltas anormais, evitando teletransporte após suspensão.

Três símbolos são recolhidos por interação próxima com linha de visão. A sentinela patrulha/persegue, recebe três disparos e causa dano por proximidade; paredes e grades bloqueiam passagem, tiros e ataques. Vencer requer os três símbolos e interação na saída. NFC não executa esse caminho nem marca vitória. Conquista concede acesso; não publica o MP3 ausente.

Um único requestAnimationFrame por sessão. Pausa, menu, perda de captura do mouse, blur e aba oculta interrompem simulação/áudio e limpam entradas. Retomar requer ação do visitante. Sair cancela o frame, invalida a solicitação de entrada pendente, aborta listeners, solta pointer lock, desconecta resize, fecha áudio e descarta instâncias, geometria, materiais e texturas. Falha WebGL oferece retorno à home; falha de arte opcional mantém o percurso.

Sem exposição de atalhos de vitória, setters de simulação ou cheats no build. O mapa na pausa existe para o jogador; o playtest automatizado pode ler seu marcador e enviar teclas comuns, sem escrever estado ou progresso.

## Interface e conteúdo

HUD compacto: objetivo/símbolos, integridade e pausa. Centro livre para mirar. Instruções, mapa e volumes ficam nos menus. Movimento reduzido elimina recuo/oscilação não essenciais.

## Modos de entrada e permissão do navegador

`input.ts` explicita os modos `mouse`, `touch`, `drag` e `keyboard`; `data-controls` espelha o modo na interface. O visitante escolhe mouse/teclado ou toque no menu, inclusive em dispositivos híbridos. O teclado alternativo fica dentro de **Controles e ajustes**.

No modo mouse, **Entrar no labirinto** solicita Pointer Lock dentro da ação do visitante. O runtime espera `pointerlockchange` e confirma `document.pointerLockElement === canvas` antes de iniciar simulação/áudio. API ausente, erro ou ausência de confirmação mantém o menu e oferece **Jogar com mouse livre**. Esse modo usa botão direito segurado para mirar e esquerdo para disparar, inclusive simultaneamente; `mousedown`/`mouseup` tratam cada botão. Uma captura tardia é liberada quando a sessão já não a espera. Esc/P, blur e perda de captura devolvem a pausa.

No toque, a região esquerda posiciona o direcional flutuante junto ao dedo, com zona morta; a região direita controla a câmera. **Disparar** pode ser mantido e arrastado para mirar durante o disparo. Cada dedo possui sua ação; `pointerup`, `pointercancel`, `lostpointercapture`, pausa e resize limpam as entradas e capturas correspondentes. Um segundo dedo não substitui o proprietário do botão de disparo.

**Tela cheia** tem ação própria e não é requisito para jogar: botão nos menus/na interface ou **F durante a partida**, inclusive com mouse capturado. A solicitação usa a raiz HTML `.woodstock-game`, filha do diálogo, e trata recusa/indisponibilidade. A saída de fullscreen pausa a partida. O renderer conserva seu limite de pixels ao redimensionar; a cena também precisa ser redesenhada quando o menu está pausado. Não se alteram permissões do browser, iframe ou sistema operacional para contornar restrições do ambiente embutido.

Referências primárias consultadas na correção: [Pointer Lock e ativação do visitante](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock) — incluindo confirmação por eventos e ordem se combinado com fullscreen; [requestFullscreen](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen) — elemento elegível, gesto e recusa; [pointerdown](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerdown_event) — somente a primeira transição de botão do mouse; [pointercancel](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointercancel_event) e [lostpointercapture](https://developer.mozilla.org/en-US/docs/Web/API/Element/lostpointercapture_event) — interrupções de toque/captura. Esses requisitos de API não comprovam funcionamento em todo navegador embutido ou aparelho físico.

## Verificação local

`scripts/playtest-woodstock.mjs` abre **Controles e ajustes** antes de iniciar/retomar pelo teclado, percorre uma rota conhecida lendo o mapa visível e não injeta estado. `scripts/measure-game-performance.mjs` tenta a entrada principal com captura nativa no desktop; se houver recusa, abre o mesmo painel e registra o uso do teclado, sem declarar captura bem-sucedida. A pausa da medição usa P, pois o mouse capturado não deve acionar menus DOM.

A medição cobre cache frio local, recursos solicitados, silêncio inicial, áudio somente após opt-in, chamadas de desenho e intervalos de frames em uma amostra estacionária de 3,5 segundos. Capturas têm pastas por execução e relatórios anteriores são preservados em `docs/baselines/`. Mobile emulado e taxa de atualização do host não representam desempenho de Android/iOS físico. Os relatórios de verificação devem identificar o build efetivamente executado.

## Áudio e fontes

A música original **não foi fornecida**. O WAV de teste foi sintetizado localmente por `scripts/generate-game-audio.mjs`, sem amostras externas: mono 16 kHz, 12 s, 384.044 bytes. É identificado como demonstração, vem desativado e só é solicitado após ativar o som e entrar/retomar. Esse único arquivo é permitido pelos verificadores; nenhum master foi incluído.

Fontes Game Studio, referências e integridade: [skills-registry.md](skills-registry.md). Direção e assets: [game-art-direction.md](game-art-direction.md). A arquitetura não substitui as evidências de [playtest](playtest-woodstock.md).

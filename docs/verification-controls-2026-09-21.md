# Verificação dos controles de Woodstock — 21/09/2026

Escopo: mouse e teclado no PC, controles simultâneos de toque no celular, menus, recuperação e apresentação visual. `systematic-debugging` orientou a reprodução anterior à correção; `game-playtest` orientou a distinção entre entradas reais do navegador e regressões sintéticas. Não houve injeção de posição, vida, vitória ou progresso.

Ambiente: preview local em `http://127.0.0.1:4173`, Chrome isolado headless, Playwright Test 1.63.0. Projetos: desktop 1440 × 1000 e Pixel 7 emulado, incluindo captura adicional em 915 × 412. Os testes usam o Chrome instalado, sem alterar o perfil pessoal.

## Reprodução anterior à correção

- No Chrome externo isolado, **Entrar no labirinto** adquiriu captura nativa do mouse (`document.pointerLockElement` apontando para o canvas). Movimento real do mouse mudou a rotação indicada pelo mapa de pausa de 0° para aproximadamente 36,55° e mudou visivelmente a inclinação da câmera. Portanto, a captura não falhava universalmente nesse ambiente.
- A investigação paralela da tarefa principal reproduziu recusa de captura no navegador incorporado: a interface antiga entrava em partida apesar de `pointerLockElement` nulo. Esse achado é da inspeção da tarefa principal, não uma alegação de reprodução pelo teste Chrome externo.
- **O clique rápido era perdido entre quadros.** Em cinco cliques reais de `page.mouse.click`, uma região da bobina não apresentou os pixels claros do disparo; manter o botão por 20 ms produziu 696 pixels claros na mesma região. Um down/up sintético no mesmo task também não disparou. A causa encontrada foi limpar o booleano de disparo no mouseup antes de a simulação amostrá-lo no próximo quadro.
- Três contatos de toque do Chrome moveram, miraram e dispararam simultaneamente. A soltura individual foi conferida com eventos de ponteiro observados. Neste Chrome, `Input.dispatchTouchEvent` com `touchEnd` e um contato listado encerrou esse contato; não se deve interpretar a lista como os contatos que permanecem ativos. Um primeiro experimento usou essa interpretação errada e foi descartado como evidência de defeito do aplicativo.

Capturas de referência: [`screenshots/controls-baseline-2026-09-21/`](screenshots/controls-baseline-2026-09-21/). Os nomes com `correct-events` registram o experimento com a soltura corrigida.

## Cobertura versionada

[`tests/e2e/game-controls.spec.ts`](../tests/e2e/game-controls.spec.ts) acrescenta oito cenários, com exclusões explícitas para dispositivos não pertinentes:

1. Captura nativa, rotação horizontal pelo mapa de pausa, inclinação por comparação de imagem renderizada e disparo por clique esquerdo rápido real.
2. Recusa de captura mantém o menu; mouse livre permite arrastar com o botão direito e clicar com o esquerdo simultaneamente; soltar o esquerdo preserva o arraste; pausa e retomada preservam modo e posição.
3. A primeira captura recusada pode ser tentada novamente, passando então pela API nativa e sem iniciar uma partida invisível.
4. Down/up sintético no mesmo task mantém o primeiro disparo até o próximo quadro. Este caso testa somente o buffer de eventos.
5. F entra e sai de tela cheia real; sair pausa, e retomar preserva posição e modo teclado.
6. Três contatos simultâneos: mover, olhar e disparar. Soltar o dedo da câmera ou do movimento não cancela o disparo ainda mantido.
7. O dedo no botão Disparar pode arrastar a mira enquanto outro mantém o movimento.
8. O seletor explícito de mouse/toque tem estados acessíveis e pode ativar toque em qualquer um dos dois projetos.

[`tests/e2e/game.spec.ts`](../tests/e2e/game.spec.ts) mantém os 12 cenários anteriores por projeto, adaptando a alternativa de teclado dentro de Controles e ajustes, o primeiro item da contenção de foco e o menu honesto de recusa. Inclui carregamento sob demanda, pausa, retomada, reinício, ausência de recompensa indevida, WebGL indisponível/perdido, arte ausente, áudio opcional, toque e capturas.

O estado `data-firing` observado pelos testes é o estado visual real da mira, atualizado pelo runtime a partir do lampejo do disparo. O mapa de pausa é uma interface visível ao jogador. Ambos são lidos, nunca usados para alterar a simulação. As falhas de captura/recursos e eventos de ciclo de vida são explicitamente simulados; os gestos de mouse e multitoque usam as APIs de entrada do navegador.

## Execuções e resultados deste trabalho

| Execução | Resultado e interpretação |
| --- | --- |
| Desktop inicial, 19 cenários | 15 passaram, 3 exclusões e 1 falha de seletor: `[data-controls]` passou a existir na raiz e no `details`. Corrigido para `details[data-controls]`. |
| Desktop + mobile, 38 cenários | 28 passaram, 9 exclusões e 1 navegação com `ERR_HTTP_RESPONSE_CODE_FAILURE` durante substituição do build. A falha ocorreu antes de qualquer entrada ou asserção de comportamento. |
| Build estável `runtime-BQ642lJL.js`, 40 cenários | 29 passaram, 10 exclusões e 1 expectativa de teste incorreta: o runtime pausa deliberadamente ao sair da tela cheia. O teste foi ajustado para conferir essa pausa e a retomada sem reinício. |
| Tela cheia isolada após ajustar o contrato | 1 passou: entrada/saída reais e retomada com a posição preservada. |
| `npm.cmd run typecheck`, após os ajustes | Passou. |

Esses resultados são **compostos entre execuções**, não uma alegação de 40 cenários aprovados em uma única bateria. Os 10 casos excluídos correspondem a controles específicos do dispositivo. Após essa execução, a asserção de mouse livre foi reforçada para exigir giro acima de 18°: os 100 px anteriores ao clique produziriam apenas cerca de 12,6°; os 60 px posteriores são necessários para demonstrar que soltar o esquerdo preserva o arraste direito. A verificação dessa asserção está incluída na bateria final conduzida pela tarefa principal.

## Inspeção visual e limites

Foram abertos e inspecionados os PNGs de menu e partida em desktop, retrato e paisagem mobile, além do par antes/depois de inclinar a câmera. Não foram encontrados cortes no HUD ou nos controles nessas capturas. O cenário de concreto, grades e correntes, a arma, o objetivo e os botões permanecem distinguíveis. Evidências atuais: [`screenshots/game-controls-2026-09-21/`](screenshots/game-controls-2026-09-21/); as capturas anteriores de Woodstock foram preservadas.

Emulação de Pixel 7 e multitoque do Chrome não substituem teste em telefone físico, Safari/iOS ou múltiplos navegadores. A captura nativa confirmada no Chrome externo não garante que o navegador incorporado a permita; o caminho de recusa tem cobertura separada. Eventos sintéticos de blur/visibilidade verificam os handlers, não uma troca real de aplicativo do sistema operacional. Esta revisão de controles não mede desempenho nem repete o percurso de vitória completo: esses resultados estão nos relatórios específicos e na verificação final da tarefa principal.

## Consolidação final

Verificação final no build `runtime-CGnwewh0.js`, `runtime-ynmn3yh0.css`, entrada `index-BtYUAmOU.js`:

| Comando / verificação | Resultado |
| --- | --- |
| `npm run build` | Código 0. Permanece o aviso Vite de chunk do jogo acima de 500 kB sem compressão; Three.js só entra sob demanda. |
| `npm run typecheck` | Código 0 após finalizar também os testes. |
| `npm test -- --run` | 79 testes unitários aprovados, sem alteração posterior em simulação/progresso. |
| `npm run test:e2e` | **66 passaram, 10 pulados por modalidade, 0 falhas, 58,7 s**, em uma única bateria final de 76 casos. Inclui a asserção reforçada do acorde direito + esquerdo. |
| `npm run check:build` | 13 arquivos, 1.934.591 B. Sem masters, originais, skills, ZIPs ou sourcemaps; apenas WAV demonstrativo autorizado. |
| Playwright CLI isolado | Entrou com captura nativa, moveu a mira, capturou imagem; console sem erros/avisos; sessão encerrada. |
| Prévia incorporada real | Recusa mantém `ready` e exibe alternativa. **Jogar com mouse livre** entra em `playing`; pausa/retomada disponíveis. A captura nativa não foi concedida nesse ambiente. |
| Inspeção visual | Desktop, retrato e paisagem; controles e HUD visíveis, sem overflow horizontal nas dimensões testadas. |
| Percurso completo | Três símbolos e saída, conquista 1/15 persistida após reload, NFC falso, sem injeção de progresso. Rodada de 46 s anterior apenas aos ajustes finais de texto/CSS/aviso de tela cheia; [registro completo](playtest-woodstock.md). |

Build/testes que iniciam subprocessos foram executados fora do sandbox após o erro `spawn EPERM` na primeira tentativa de build. Isso não exigiu alteração de configuração do projeto ou do sistema. Não houve deploy, upload, commit ou publicação de músicas.

As medições finais de carregamento estão em [performance-woodstock.md](performance-woodstock.md) e nos JSONs vinculados. A prévia temporária para telefone foi iniciada com `npm run preview -- --host 192.168.15.4 --port 4174 --strictPort`; respondeu HTTP 200 neste computador. O endereço para outro aparelho na mesma rede é `http://192.168.15.4:4174/#/jogar/track-01`. Não houve alteração de firewall, e a conexão a partir de um telefone físico permanece não verificada. O progresso é por origem/navegador: o acesso LAN tem armazenamento próprio em relação a `127.0.0.1:4173`.

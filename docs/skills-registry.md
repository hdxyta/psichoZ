# Registro de skills — psicoZ

Preparação inicial em 17/09/2026, no Windows, para a home do psicoZ. Preparação adicional de Game Studio em 21/09/2026 para a Entrega 2. Fontes exatas da seção 0 do briefing mestre; revisões fixadas por preparação, sem atualização automática nas próximas sessões.

## Inventário e escopo

- Ambiente observado: Codex desktop; versão do aplicativo não exposta nesta sessão. PowerShell/Windows; Node `v20.20.0`, npm `10.8.2`, Python `3.12.10`, Git `2.53.0.windows.1`.
- Nenhuma das seis skills selecionadas constava do catálogo ativo nem da busca por `SKILL.md` em `.codex/skills`, cache de plugins ou projeto. `skill-installer` estava disponível e foi lida como orientação de preparação.
- `playwright-cli` não estava no PATH na inspeção inicial. Posteriormente foram instalados **apenas no projeto** `@playwright/cli` `0.1.20` e `@playwright/test` `1.63.0`. A versão do pacote local foi inspecionada e `.\node_modules\.bin\playwright-cli.cmd --help` executado com saída 0, confirmando os comandos disponíveis. O CLI foi usado pelo agente principal em Chrome 153 isolado, com snapshot e screenshot desktop a 1440 × 1000. Nenhuma instalação global, extensão ou perfil pessoal foi usado.
- O CLI `0.1.20` declara dependências transitivas `playwright` e `playwright-core` **`1.64.0-alpha-2026-09-14`**, conferidas no pacote instalado. São ferramentas de desenvolvimento, fora do bundle. A suíte de regressão usa **`@playwright/test` estável `1.63.0`**; não confundir a versão do CLI com a da suíte.
- Não foram encontrados tools Chrome DevTools MCP/performance no catálogo de ferramentas. Isso não impede análise de código, bundle e rede pelo navegador disponível; traces e métricas não coletados devem ser explicitados em `performance.md`.
- `.agents` é um caminho de leitura no perfil de permissões desta sessão. As fontes foram preservadas em `docs/vendor-skills/`, fora de `public/` e `dist/`. São **cópias locais consultáveis**, não uma instalação global nem uma alegação de descoberta automática pelo Codex.
- Na preparação inicial da Entrega 1, nenhuma configuração global, MCP, extensão, perfil pessoal, skill de jogo ou dependência do site foi criada. O `AGENTS.md` e configurações existentes não foram alterados. A preparação adicional para a Entrega 2 está registrada abaixo.

## Fontes e revisões

Os links das origens abaixo apontam para commits imutáveis. Todos os arquivos copiados, incluindo referências e licenças, estão relacionados no [manifesto](vendor-skills/source-manifest.json), com caminho de origem, Git blob e SHA-256 local.

| Skill / fornecedor | Origem exata e commit resolvido | Licença consultada e localização efetiva |
| --- | --- | --- |
| `frontend-design` / Anthropic | [`anthropics/skills`, `skills/frontend-design/SKILL.md`](https://github.com/anthropics/skills/blob/34040c9c568585f6929bedeaad110ad08f079624/skills/frontend-design/SKILL.md); `34040c9c568585f6929bedeaad110ad08f079624` | Apache-2.0, [LICENSE.txt](vendor-skills/anthropics/skills/skills/frontend-design/LICENSE.txt). [SKILL.md local](vendor-skills/anthropics/skills/skills/frontend-design/SKILL.md). |
| `web-design-guidelines` / Vercel Labs | [`vercel-labs/agent-skills`, `skills/web-design-guidelines/SKILL.md`](https://github.com/vercel-labs/agent-skills/blob/063bee94c3f4df8453406c830b0a7df0f2860278/skills/web-design-guidelines/SKILL.md); `063bee94c3f4df8453406c830b0a7df0f2860278`. Metadata da skill: `1.0.0`. | README declara MIT; nenhum LICENSE/COPYING/NOTICE separado encontrado na árvore desse commit. [README com declaração preservada](vendor-skills/vercel-labs/agent-skills/README.md). [SKILL.md local](vendor-skills/vercel-labs/agent-skills/skills/web-design-guidelines/SKILL.md). |
| `playwright-cli` / Microsoft | [`microsoft/playwright-cli`, `skills/playwright-cli/SKILL.md`](https://github.com/microsoft/playwright-cli/blob/12228454ed024c9ac89abd59df3b706ed9135fd9/skills/playwright-cli/SKILL.md); `12228454ed024c9ac89abd59df3b706ed9135fd9` | Apache-2.0, [LICENSE](vendor-skills/microsoft/playwright-cli/LICENSE). [SKILL.md local](vendor-skills/microsoft/playwright-cli/skills/playwright-cli/SKILL.md), com as dez referências em `references/` preservadas. |
| `web-perf` / Cloudflare | [`cloudflare/skills`, `skills/web-perf/SKILL.md`](https://github.com/cloudflare/skills/blob/b052c32bab7dd493513260228a36c88294f343f1/skills/web-perf/SKILL.md); `b052c32bab7dd493513260228a36c88294f343f1` | Apache-2.0, [LICENSE](vendor-skills/cloudflare/skills/LICENSE). [SKILL.md local](vendor-skills/cloudflare/skills/skills/web-perf/SKILL.md). |
| `systematic-debugging` / Obra, Jesse Vincent | [`obra/superpowers`, `skills/systematic-debugging/SKILL.md`](https://github.com/obra/superpowers/blob/b36e0829c6d0140e93cfef2ca599b1b07d4a7797/skills/systematic-debugging/SKILL.md); `b36e0829c6d0140e93cfef2ca599b1b07d4a7797` | MIT, [LICENSE](vendor-skills/obra/superpowers/LICENSE). [SKILL.md local](vendor-skills/obra/superpowers/skills/systematic-debugging/SKILL.md); diretório completo, incluindo referências, exemplos e cenários de avaliação. |
| `verification-before-completion` / Obra, Jesse Vincent | [`obra/superpowers`, `skills/verification-before-completion/SKILL.md`](https://github.com/obra/superpowers/blob/b36e0829c6d0140e93cfef2ca599b1b07d4a7797/skills/verification-before-completion/SKILL.md); `b36e0829c6d0140e93cfef2ca599b1b07d4a7797` | MIT, [LICENSE](vendor-skills/obra/superpowers/LICENSE). [SKILL.md local](vendor-skills/obra/superpowers/skills/verification-before-completion/SKILL.md). |

Referência externa obrigatória da Vercel: [`vercel-labs/web-interface-guidelines/command.md`](https://github.com/vercel-labs/web-interface-guidelines/blob/e3d624baaf29dc1fc645aff3e38f03e564d2d6b1/command.md), commit `e3d624baaf29dc1fc645aff3e38f03e564d2d6b1`, consultado nesta preparação. [Cópia local](vendor-skills/vercel-labs/web-interface-guidelines/command.md) e [licença MIT](vendor-skills/vercel-labs/web-interface-guidelines/LICENSE) preservadas. A referência foi resolvida uma vez na sessão e fixada para a revisão reproduzível; não será silenciosamente atualizada em cada execução.

## Dependências, adaptações e disponibilidade

| Skill | Dependências e adaptação ao projeto | Disponibilidade / uso registrável |
| --- | --- | --- |
| `frontend-design` | Nenhuma dependência executável. Seguir artes fornecidas, preto/vermelho/branco sujo e stack HTML/CSS/TypeScript/Vite. Sugestões genéricas de copy não autorizam inventar biografia, conceito ou créditos. | Fonte lida e aplicada na composição da home; decisões registradas em `design-direction.md`. Inspeção por screenshots é uma verificação separada. |
| `web-design-guidelines` | Leitura de código e de `command.md`. Aplicar sem React, Next.js, Vercel hosting ou tradução literal de convenções inglesas de caixa de títulos para português. Elementos HTML nativos já implementam teclado sem handlers artificiais. | Skill e referência externa lidas e aplicadas à revisão estática de `index.html`, `src/styles/main.css` e `src/main.ts`; achados e limitações em `accessibility-review.md`. Não se confunde com inspeção visual nem auditoria completa de leitor de tela. |
| `playwright-cli` | Node, Playwright/CLI compatível e navegador de teste. Usar `.\node_modules\.bin\playwright-cli.cmd`, instalado localmente. A sugestão de `npm install -g` foi rejeitada por conflito com o briefing. Não usar `attach`, extensão, perfil pessoal, `kill-all` ou `close-all`. | Fonte e referências lidas e aplicadas. CLI local `0.1.20`, `--help` com saída 0, Chrome 153 isolado aberto pelo agente principal; snapshot e screenshot a 1440 × 1000 produzidos. Evidências incluem `.playwright-cli/page-2026-09-18T01-45-23-109Z.yml` e `docs/screenshots/initial-desktop.png`; fluxos completos ficam nas verificações da entrega. |
| `web-perf` | Ferramentas de navegador/rede; trace Chrome DevTools opcional conforme disponibilidade. Nenhum MCP foi instalado. Não converter exemplos de thresholds em medições reais. | Fonte lida e aplicada. Bundle, rede, transferência, LCP/CLS disponíveis, árvore acessível e diagnóstico de fonte registrados em `performance.md` e `performance-results.json`, com condições e limitações explícitas; mobile é emulado, sem alegação de aparelho real. |
| `systematic-debugging` | Sem executável obrigatório. Skill menciona `superpowers:test-driven-development`, ausente e não preparada; reprodução e regressão usam a suíte existente sem alegar execução dessa skill. | Fonte lida e aplicada às falhas de ambiente, ciclo de foco e investigação do aviso de preload. Diagnósticos descritos abaixo e em `performance.md`/`accessibility-review.md`; scripts externos de exemplo não foram executados. |
| `verification-before-completion` | Comandos do próprio projeto e critérios do briefing. Não exige instalar o restante do Superpowers nem autoriza commit/push/deploy. | Fonte lida e aplicada ao fechamento: execução final de instalação reproduzível, build, typecheck, testes e evidências de navegador. Resultados são consolidados em `verification.md`; não se infere aprovação de uma categoria a partir de outra. |

As seis skills foram lidas e aplicadas na Entrega 1. Fontes vendorizadas e aplicação efetiva são estados diferentes de instalação global ou descoberta automática de skills.

## Diagnósticos efetivamente aplicados

Registros do agente principal, sem alterar configurações globais ou contornar políticas do sistema:

- `npm ENOTCACHED`: identificada ausência de pacote no cache; obtenção de dependências pela rede autorizada, em escopo local do projeto.
- Vite `EPERM` ao chamar `net use`: identificada limitação da execução no sandbox; comando executado pelo fluxo de autorização disponível, sem alterar configuração do Windows.
- `npm ci` encontrou DLL nativa bloqueada pelo preview: identificado processo do próprio projeto; preview encerrado e `npm ci` repetido com sucesso.
- Dialog nativo não reteve Tab como esperado no teste: falha reproduzida, adicionado ciclo explícito de foco e suíte E2E repetida; achado e correção em `accessibility-review.md`.
- Aviso intermitente de preload: investigadas fonte carregada/renderizada e duplicação de requisições; não reproduzido no ensaio descrito em `performance.md`, sem inventar causa ou aplicar alteração especulativa.

## Revisão dos scripts e integridade

1. Foram lidos `install-skill-from-github.py` e `github_utils.py` do `skill-installer` disponível em `C:/Users/Pedro/.codex/skills/.system/skill-installer/`. O helper aceita `--dest`, porém o destino padrão é global e o fluxo pode consultar variáveis de credenciais. **Não foi executado.**
2. A cópia usou somente `git ls-remote` para resolver HEAD e requisições HTTPS aos repositórios públicos selecionados, com os hashes fixados. Foram copiadas as subárvores das seis skills, licenças e a referência externa, sem executar instaladores ou scripts baixados. O primeiro acesso Git dentro do sandbox falhou ao alcançar o proxy; a leitura de rede autorizada em seguida resolveu os commits e arquivos.
3. `systematic-debugging/find-polluter.sh` foi lido integralmente: enumera arquivos e executa `npm test` para cada um, suprimindo a saída; não foi executado. `condition-based-waiting-example.ts` também foi lido: é um exemplo vinculado à infraestrutura Lace, não código do psicoZ, e não deve integrar o build/typecheck da aplicação.
4. O exemplo de diagnóstico no `SKILL.md` de debugging pode imprimir valores de ambiente. Foi deliberadamente excluído: nenhum dump de ambiente, chave, token ou credencial é necessário ao trabalho.
5. Não foram alterados os bytes dos arquivos de origem. Foram verificados **33 arquivos**, comparando SHA-256 local e `git hash-object --no-filters` com o Git blob da árvore remota: nenhum divergente. Foram conferidos **17 links Markdown relativos documentais**, sem caminhos ausentes; links dentro de exemplos de código foram excluídos dessa contagem. Referências relativas dentro das pastas selecionadas foram mantidas. Links para ferramentas/skills externas são referências, não alegações de instalação.
6. Nenhum arquivo das skills deve ser importado por `src/`, copiado a `public/` ou incluído no bundle. Os exemplos de shell/TypeScript são documentação somente.

O estado acima distingue preparação, leitura e aplicação efetiva das fontes. Comandos, resultados e limitações da home, CLI, testes e performance ficam nos relatórios específicos da entrega; a existência deste registro não os substitui.

## Entrega 2 — preparação de Game Studio em 21/09/2026

O início autorizado da primeira fase, Woodstock, acrescenta somente `web-game-foundations`, `three-webgl-game`, `game-ui-frontend` e `game-playtest` ao conjunto consultado. O inventário inicial desta etapa não encontrou essas skills no catálogo ativo, em `.codex/skills`, no cache de plugins ou no projeto. Não houve instalação global, alteração de `.agents`, configuração de MCP, mudança de stack ou execução de scripts externos.

**Origem exata:** [`openai/plugins`](https://github.com/openai/plugins/tree/1dc195897af4161d039b80d8471ec0a10c9bbc89/plugins/game-studio), pacote `plugins/game-studio`, commit **`1dc195897af4161d039b80d8471ec0a10c9bbc89`**, resolvido por `git ls-remote` nesta preparação. O [manifesto original preservado](vendor-skills/openai/plugins/plugins/game-studio/.codex-plugin/plugin.json) declara versão **`0.1.2`** e licença **MIT**. Não existe arquivo `LICENSE`, `COPYING` ou `NOTICE` separado na raiz do repositório ou nesse pacote no commit examinado. Essa ausência foi registrada; não foi inventado texto de licença nem copiada uma licença de outro plugin.

**Localização efetiva:** `docs/vendor-skills/openai/plugins/plugins/game-studio/`. São fontes locais consultáveis, não plugin conectado ou skills instaladas para descoberta automática. O pacote completo foi preservado para manter `../../references/`, referências entre skills, scripts e manifesto nos caminhos originais. As outras skills e os ícones contidos no pacote permanecem apenas como parte do arquivo de origem: não foram ativados, instalados no Codex nem integrados ao site.

| Skill | Caminho de origem / fonte fixada | Referência local, dependências e adaptação |
| --- | --- | --- |
| `web-game-foundations` | [`plugins/game-studio/skills/web-game-foundations/SKILL.md`](https://github.com/openai/plugins/blob/1dc195897af4161d039b80d8471ec0a10c9bbc89/plugins/game-studio/skills/web-game-foundations/SKILL.md) | [SKILL local](vendor-skills/openai/plugins/plugins/game-studio/skills/web-game-foundations/SKILL.md). Sem executável obrigatório; separar simulação serializável, renderer, entrada, interface, áudio e progresso. A escolha Three.js/TypeScript/Vite já está definida e não é reaberta. |
| `three-webgl-game` | [`plugins/game-studio/skills/three-webgl-game/SKILL.md`](https://github.com/openai/plugins/blob/1dc195897af4161d039b80d8471ec0a10c9bbc89/plugins/game-studio/skills/three-webgl-game/SKILL.md) | [SKILL local](vendor-skills/openai/plugins/plugins/game-studio/skills/three-webgl-game/SKILL.md). Three.js é dependência da implementação, não da consulta da skill. Aplicar limites de simulação/câmera/renderização, resize, contexto WebGL, carregamento e descarte. Rapier, SpectorJS, GLB/Draco/KTX2 e pós-processamento não entram automaticamente: geometria simples e colisões testáveis seguem o briefing. |
| `game-ui-frontend` | [`plugins/game-studio/skills/game-ui-frontend/SKILL.md`](https://github.com/openai/plugins/blob/1dc195897af4161d039b80d8471ec0a10c9bbc89/plugins/game-studio/skills/game-ui-frontend/SKILL.md) | [SKILL local](vendor-skills/openai/plugins/plugins/game-studio/skills/game-ui-frontend/SKILL.md). DOM/CSS para HUD e menus, mantendo identidade aprovada; objetivo/status compactos, centro livre, controles de toque utilizáveis. Pausa/menu precisam bloquear entrada da câmera e tratar pointer lock explicitamente. |
| `game-playtest` | [`plugins/game-studio/skills/game-playtest/SKILL.md`](https://github.com/openai/plugins/blob/1dc195897af4161d039b80d8471ec0a10c9bbc89/plugins/game-studio/skills/game-playtest/SKILL.md) | [SKILL local](vendor-skills/openai/plugins/plugins/game-studio/skills/game-playtest/SKILL.md). Usar navegador/Playwright disponível, screenshots do mundo e HUD e percurso real. Injeção de vitória/progresso não comprova jogabilidade. Restrições de automação de câmera, WebGL ou aparelho devem ser relatadas sem aprovação inventada. |

### Leituras relevantes e integridade

As quatro skills foram lidas. Foram consultadas as referências compartilhadas `engine-selection.md`, `three-webgl-architecture.md`, `threejs-stack.md`, `threejs-vanilla-starter.md`, `three-hud-layout-patterns.md`, `frontend-prompts.md`, `webgl-debugging-and-performance.md` e `playtest-checklist.md`, todas sob [references](vendor-skills/openai/plugins/plugins/game-studio/references/three-webgl-architecture.md). Os exemplos de GLB e Rapier também foram lidos para identificar suas dependências; não foram executados ou adotados automaticamente. Os starters são exemplos mínimos, não substituem timestep, lifecycle e descarte necessários no projeto.

O [manifesto de integridade específico](vendor-skills/game-studio-source-manifest.json) registra **40 arquivos**, cada um com repositório, commit, caminho original, Git blob e SHA-256. Todos foram conferidos por SHA-256 e pelo hash Git blob dos bytes recebidos: nenhum divergente. Foram verificados **67 caminhos relativos** documentados nas skills e referências, sem arquivos ausentes. As fontes anteriores da Entrega 1 permanecem fixadas no manifesto original.

Os três scripts do pacote foram lidos integralmente antes de qualquer possível uso:

- `scripts/build_sprite_edit_canvas.py`: lê imagem seed, redimensiona com Pillow e grava PNG no caminho fornecido.
- `scripts/normalize_sprite_strip.py`: recorta/normaliza frames de uma tira e grava PNGs no diretório fornecido; pode substituir arquivos de mesmo nome.
- `scripts/render_sprite_preview_sheet.py`: lê PNGs de um diretório e grava uma folha de contatos.

Nenhum foi executado, nenhum pacote Python foi instalado por esta preparação e nenhum sprite foi fabricado a partir das artes. Eles permanecem documentação de uma etapa que não exige pipeline de sprites. Ícones do pacote, fontes de skills e exemplos não entram em `public/`, `dist/` ou imports da aplicação.

**Estado desta preparação:** quatro skills disponíveis e lidas em escopo local; referências e declaração de licença preservadas. A leitura não comprova implementação ou playtest concluído. A aplicação à fase, comandos executados, screenshots, desempenho e limitações precisam constar nos relatórios da Entrega 2.

## Reutilização em 21/09/2026

As mesmas cópias e versões foram reutilizadas na mistura visual solicitada pelo usuário, sem instalar/atualizar skills ou executar scripts externos: `frontend-design` na composição; `web-design-guidelines` na revisão estática/contraste; `playwright-cli` na inspeção isolada; `web-perf` na medição local; `systematic-debugging` na investigação do achatamento dos picos do SVG e da captura com documento antigo; `verification-before-completion` no build/typecheck, testes e evidências finais. Resultados em [verification-mix-2026-09-21.md](verification-mix-2026-09-21.md). Essas fontes continuam vendorizadas, não instaladas globalmente nem anunciadas como descoberta automática.

### Controles de Woodstock — PC e celular

Na revisão dos controles, as cópias locais fixadas acima foram reutilizadas: `game-ui-frontend` no HUD, menu e áreas de toque; `web-game-foundations`/`three-webgl-game` na separação de entrada, captura, simulação e resize; `game-playtest` e `playwright-cli` nos gestos reais e inspeção visual; `systematic-debugging` na reprodução da recusa do mouse no navegador incorporado e dos cliques perdidos entre frames; `web-perf` nas medições locais; `verification-before-completion` nas verificações finais. Não houve nova instalação, atualização de dependências, execução de scripts de skills ou alteração global. Evidências e limites em [verification-controls-2026-09-21.md](verification-controls-2026-09-21.md).

## Catálogo de 15 jogos — 30/09/2026

Na implementação do hub e do catálogo foram relidas as cópias locais de `game-ui-frontend` e `verification-before-completion` indicadas neste registro. A primeira orientou a hierarquia do seletor, controles nativos, contraste, layout responsivo e preferência de redução de movimento; a segunda foi aplicada à validação das associações faixa/nível e da persistência. As fontes e versões permanecem as mesmas, sem instalação global, atualização ou execução de scripts das skills.

Verificação específica do catálogo e store: `npm test -- tests/unit/access.test.ts tests/unit/progress.test.ts`, **59 testes aprovados** em 30/09. A primeira execução encontrou `spawn EPERM` do Vite no sandbox; a repetição pelo fluxo autorizado de subprocessos passou. Isso verifica regras de catálogo, acesso e persistência, sem equivaler a playtest ou aprovação visual. A documentação das famílias atuais está em [GAME_SYSTEM.md](GAME_SYSTEM.md). A consulta de referências externas não é uma declaração de incorporação de código ou licença de terceiros.

## Incorporação de 15 bases de jogos — 30/09/2026

Após a primeira versão do catálogo, o pedido de reutilizar jogos prontos levou à incorporação de código de terceiros revisado. Esta etapa reutilizou as cópias locais já lidas de `game-ui-frontend` e `verification-before-completion`, nas mesmas revisões fixadas acima. Não houve instalação/atualização de skills, execução de scripts de skills, alteração global ou conexão de MCP. O código dos jogos não é uma skill; suas origens, revisões e licenças estão registradas separadamente em [game-sources.md](game-sources.md).

`game-ui-frontend` orientou os botões nativos, controles de toque, instruções antes da tentativa e adaptação visual dos puzzles. `verification-before-completion` orientou a distinção entre código incorporado, verificações de regras, inspeção de navegador e vitória jogada. Não se afirma uso de uma nova skill que não tenha sido lida.

A verificação atualizada do catálogo/store (`npm test -- tests/unit/access.test.ts tests/unit/progress.test.ts`) passou novamente com **59 testes**. O teste do catálogo agora valida os 15 jogos adaptados e seus gêneros/slugs distintos, os títulos aprovados, a posição 15 ainda pendente, as origens e IDs inválidos. Os cenários de acesso e persistência continuam separados da execução do jogo.

O script próprio `scripts/verify-vendor-puzzles.mjs` executou **oito cenários** de memória, campo minado, Sokoban e 2048 em desktop/Pixel 7 emulado, com storage próprio bloqueado, sem erro de página, requisição externa ou overflow horizontal. Memória e Sokoban chegaram à vitória por ações da interface; campo minado e 2048 tiveram entrada/interação verificada, sem afirmar vitória completa. Capturas foram geradas e as quatro mobile inspecionadas. Esse resultado não aprova os demais jogos nem equivale à verificação final do build; o escopo está em [game-sources.md](game-sources.md#verificação-local-dos-quatro-puzzles).

### Integração e verificação final dos 15 jogos

A integração também consultou as cópias locais fixadas de `web-game-foundations`, `game-playtest`, `game-ui-frontend`, `systematic-debugging`, `verification-before-completion`, `playwright-cli` e `web-perf`. Foram aplicadas respectivamente à separação das regras/entrada/ciclo de vida, partidas por entradas reais, menus e controles, reprodução das falhas de pausa/toque/desenho, evidências antes da conclusão, inspeção de navegador e medição de carregamento. A execução de navegador usou o Playwright Test/API já disponível no projeto; não se afirma execução do binário playwright-cli. A coleta de performance usou o script local revisado, PerformanceObserver e CDP, sem DevTools MCP.

Não houve nova instalação global, atualização das fontes ou execução de scripts de skills. As origens e versões permanecem as registradas acima. O [relatório final](verification-github-games-2026-09-30.md) distingue os 173 testes unitários, 84 E2E, 34 cenários repetidos após o build final, oito vitórias jogadas e os sete jogos sem vitória completa verificada. Toque emulado não comprova aparelho físico.

## Tracklist com miniaturas — 30/09/2026

As cópias locais já fixadas de frontend-design, web-design-guidelines e sua referência command.md, e verification-before-completion foram relidas e aplicadas à composição, revisão de acessibilidade e validação. A consulta web read-only das diretrizes feita durante a revisão não substituiu nem atualizou silenciosamente a cópia fixada. As capturas usaram Playwright Test/API já disponível, não uma nova instalação de CLI ou skill. Nenhum script de skill foi executado. O plano está em design-direction.md; as capturas dos jogos têm manifesto próprio em game-thumbnails.json.

O refinamento seguinte em formato de playlist reutilizou as mesmas orientações de frontend-design e web-design-guidelines já lidas. A validação usa build com checagem TypeScript, testes da home e inspeção Playwright; não houve preparação de skill nova. O vidro é CSS estático restrito à miniatura e preserva o contraste do texto e o foco da linha.

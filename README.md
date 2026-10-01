# psicoZ

Home do álbum e **15 jogos diferentes, um por posição da tracklist**, adaptados de bases existentes com licença verificada. A direção visual combina preto, papel, vermelho vivo, sombras desenhadas e traço de tattoo com suspense. HTML, CSS, TypeScript e Vite, com jogos DOM/Canvas em iframes locais. Sem backend ou login.

## Rodar localmente

Dependências fixadas no `package-lock.json`; não é necessário instalar pacotes globais. A faixa de Node suportada está em `package.json`.

```powershell
npm ci --ignore-scripts
npm run dev
```

Abra o endereço mostrado pelo Vite. Para verificar o build:

```powershell
npm run typecheck
npm test
npm run build
npm run check:build
npm run preview -- --port 4173
npm run test:e2e
```

Os testes de navegador usam Chrome em contexto isolado. É possível selecionar Edge com `$env:PLAYWRIGHT_CHANNEL='msedge'`. Viewport e toque emulados não substituem teste em aparelho físico. No sandbox desta sessão, Vite e navegador precisaram do fluxo de aprovação de subprocessos, sem alterar configurações da máquina.

`npm run assets` regenera os WebPs a partir dos originais locais. `node scripts/measure-performance.mjs` mede o preview na porta 4173. Scripts próprios foram revisados antes da execução; scripts de instalação foram desativados. Os exemplos de jogos foram copiados e revisados como fontes, sem executar instaladores dos repositórios.

## Conteúdo e comportamento

- `src/config/site.ts`: lançamento planejado, estado editorial, conceito, artista e URLs opcionais de pré-save/escuta.
- `src/data/catalog.ts`: títulos da contracapa, 15ª posição com título pendente, 15 níveis, quatro artes e recompensas ainda não publicadas.
- `src/data/vendor-games.ts`: jogo distinto por faixa, origem, objetivo, controles e tempo máximo.
- `src/state/progress.ts`: estado v2 em `psicoz:progress`, migração v1, validação e fallback em memória.
- `src/state/access.ts`: decisão central de acesso; NFC e conquista não publicam arquivos.
- `src/main.ts`, `index.html` e `src/styles/`: home, seletor, diálogos, responsividade e fallback de imagens.
- `src/ui/game-entry.ts` e `src/game/vendor/runtime.ts`: carregamento da tentativa, pausa, reinício, resultado e conquista.
- `public/games/`: cópias executáveis adaptadas e respectivas licenças; `docs/vendor-games/`: originais preservados fora do build.

Abra `http://localhost:4173/?edition=nfc#colecao` para verificar a tag. A URL persiste acesso, mantendo conquistas separadas. É compartilhável e não autentica compra. O reset pede confirmação, afeta somente a chave do projeto e remove o parâmetro NFC da visita atual para não restaurar o acesso involuntariamente no reload.

O estado de lançamento é editorial, não calculado pelo relógio do visitante. Quando `releaseStatus` mudar para `released`, a chamada usa `listeningLinks`. URLs não fornecidas continuam pendentes. Nenhum clique é apresentado como pré-save concluído ou download salvo.

## Jogos atuais

Faixas e jogos compartilham a mesma tracklist visual (`#faixas` / `#jogo`), em linhas com títulos góticos e miniaturas de contorno prateado discreto. Cada item combina a arte do álbum com uma captura real do minigame, seu objetivo e o link para jogar. As 15 miniaturas são arquivos locais estáticos, carregados conforme a rolagem; origens e procedimento em [game-thumbnails.json](docs/game-thumbnails.json). [Verificação do layout atual](docs/verification-ink-silver-2026-09-30.md).

O hub `#jogo` abre qualquer rota de `#/jogar/track-01` a `#/jogar/track-15`: labirinto, Snake, Flappy, Pong, Tetris, memória, corrida, Untangle, Asteroids, Breakout, campo minado, Space Invaders, Sokoban, Simon e 2048 com alvo 256. Cada jogo tem objetivo e controles apresentados antes do botão **Jogar**, pausa, reinício e resultado. Os jogos usam as regras copiadas das bases, com adaptações de aparência, integração e duração.

O iframe é criado ao iniciar a tentativa; somente aquele jogo é carregado. A ponte local compartilha pausa e relógio, e as mensagens são vinculadas à sessão. Teclado, mouse e controles de toque são oferecidos conforme a mecânica. As conquistas anteriores continuam válidas nos mesmos IDs e a contagem do hub depende de níveis concluídos, nunca de NFC. MP3 e demais recompensas ainda aguardam publicação.

[GAME_SYSTEM.md](docs/GAME_SYSTEM.md) descreve arquitetura, objetivos e controles. [game-sources.md](docs/game-sources.md) consolida as 15 bases, revisões, licenças e exclusões de assets. Os exemplos anteriores em `src/game/` foram preservados, mas as rotas atuais usam os jogos adaptados. Woodstock agora abre o labirinto; os relatórios e scripts de Woodstock 3D são históricos e não validam a versão atual.

## Assets e publicação futura

Originais do álbum permanecem em `source-art/`, com derivados otimizados em `public/assets/`. Fontes de skills, documentos e originais dos exemplos ficam fora de `dist/`. Os scripts adaptados dos jogos e seus avisos de licença ficam em `public/games/`. A fonte UnifrakturCook é local e tem licença OFL. Os jogos não incluem músicas, masters ou imagens sem autorização verificável; Racer e Breakout tiveram assets com restrições excluídos.

`VITE_ASSET_BASE_URL` é pública e opcional. Vazio usa `/assets/...`; uma URL configurada altera a base de imagens e arquivos locais configurados. JavaScript, CSS e fonte continuam no site. Nenhuma credencial deve entrar nessa variável.

O build produz `dist/` com a home e a página separada `/cd`. A área da edição física requer também as Pages Functions em `functions/`, secrets de sessão e binding do R2 privado. [Guia da edição física](docs/cd-collector.md) descreve configuração, áudios, NFC e testes (`npm run test:cd`). Nenhuma conta, bucket, DNS ou publicação remota foi configurada. [Preparação de publicação](docs/publication-notes.md) contém as demais pendências de hospedagem.

## Evidências e documentação

- [Verificação dos 15 jogos de 30/09](docs/verification-github-games-2026-09-30.md): comandos, resultados, vitórias jogadas, inspeção visual, carregamento e limites.
- [Catálogo e arquitetura atuais](docs/GAME_SYSTEM.md) e [fontes dos 15 jogos](docs/game-sources.md).
- [Registro de skills](docs/skills-registry.md), com leitura/aplicação distinta de instalação.
- [Origem das artes](docs/assets.md), [conteúdo pendente](docs/content-checklist.md) e [briefing preservado](docs/briefing-master.md).
- Histórico: [controles de 21/09](docs/verification-controls-2026-09-21.md), [Woodstock 3D](docs/verification-woodstock.md), [mistura visual](docs/verification-mix-2026-09-21.md), [entrega inicial](docs/verification.md) e [referências de 22/09](docs/game-example-references.md).

Resultados históricos e ensaios parciais não substituem a verificação final dos 15 jogos. A aprovação editorial e a publicação do álbum permanecem separadas da implementação: título da faixa 15, créditos, links e arquivos ainda dependem do conteúdo fornecido.
# psichoZ
# psichoZ
# psichoZ
# psichoZ
# psichoZ
# psichoZ

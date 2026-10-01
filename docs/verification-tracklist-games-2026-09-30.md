# Tracklist com miniaturas dos jogos — 30/09/2026

## Mudança

Tracklist e seletor agora são uma única lista de 15 faixas. A seção vem depois da abertura do álbum; os endereços `#faixas` e `#jogo` continuam funcionando, assim como as rotas individuais. Cada faixa apresenta recorte da capa real, captura do seu jogo, número, título, mecânica, objetivo, estado da conquista e ação Jogar. O áudio pendente continua explícito.

Desktop usa três colunas; tablet, duas; celular, linhas com miniatura lateral. Não foram criadas capas oficiais novas para as músicas. Os detalhes da capa são recortes de interface e a imagem ao lado é uma captura do minigame correspondente.

As 15 capturas JPEG têm 338.839 bytes no total, sem processamento dos motores na home. Foram obtidas por screenshots de partidas locais; não há vídeo, autoplay ou iframe nas miniaturas. Dimensões, seletores, hashes e origens estão em [game-thumbnails.json](game-thumbnails.json), com procedimento reproduzível em `scripts/capture-game-thumbnails.mjs`. As licenças dos jogos continuam registradas em [game-sources.md](game-sources.md).

As imagens usam `loading="lazy"`, espaço reservado e enquadramento CSS sem distorção. Em falha de miniatura, a mecânica aparece no lugar e o link para jogar continua ativo. Cada item tem uma única âncora nativa, com nome acessível; as imagens decorativas não repetem o título ao leitor de tela. Atualizar o progresso preserva as âncoras existentes para permitir restaurar o foco ao sair do jogo.

## Verificações

- `npm run typecheck`: aprovado.
- `npm test -- --configLoader native --pool=threads --maxWorkers=1`: 173 testes aprovados em dez arquivos. Inclui regras preexistentes; não representa nova verificação de 173 partidas.
- `npm run build -- --configLoader native`: aprovado, 18 módulos. Repetido após os últimos ajustes de contraste e botão de fechar.
- `npm run check:build`: aprovado, 127 arquivos e 2.217.772 bytes no build final; originais, fontes de skills e masters continuam fora do build.
- `npm run test:e2e -- tests/e2e/home.spec.ts tests/e2e/spectrum.spec.ts tests/e2e/vendor-games.spec.ts`: 70 testes aprovados em desktop e Pixel 7 emulado. Cobrem a lista única, navegação, painel, coleção/NFC, storage inválido ou bloqueado, reset, movimento reduzido, imagens ausentes, layouts e integração com as 15 rotas. A execução antecedeu somente os ajustes finais de CSS de contraste da miniatura de Asteroids e sobreposição do botão de fechar.
- Inspeção visual: capturas da seção a 1440, 393 e 320 px, incluindo títulos longos e linhas de jogos diferentes. Evidências em [screenshots/tracklist-games-2026-09-30](screenshots/tracklist-games-2026-09-30/).
- Após os dois ajustes finais, seis verificações dirigidas com Playwright API/Chromium passaram: três larguras sem overflow e com 15 itens; falha 404 de miniatura, saída por mouse/toque em pronto/pausa e retorno de foco em desktop e celular emulado; vitória real de memória por seis pares, fechamento e retorno à mesma âncora com o estado Conquistada. As seis capturas da seção foram refeitas esperando as imagens visíveis carregarem. O botão X era interceptado pela sobreposição do menu; a correção de empilhamento o mantém clicável, preservando o bloqueio do tabuleiro durante a pausa.

## Limites

Não houve teste em aparelho físico, auditoria completa com leitor de tela ou nova medição de Core Web Vitals. O peso das imagens é uma medida de arquivos locais, não uma estimativa de tempo em rede móvel. As limitações de partidas completas dos 15 jogos permanecem no [relatório anterior](verification-github-games-2026-09-30.md). Não houve mudança de stack, dependências, configurações globais ou deploy.

# Playlist psicoZ com miniaturas glass — 30/09/2026

O pedido de linhas no estilo playlist substitui a grade de capas da revisão anterior. Há uma linha por faixa, com número, miniatura menor, título, mecânica/objetivo e Jogar. No celular a mecânica fica sob o título; o menu do jogo apresenta o objetivo completo antes da tentativa. Áudio não publicado continua sinalizado.

Miniaturas: 64px no desktop, 52px no celular e 46px nas telas mais estreitas. O vidro combina borda translúcida, reflexo estático e blur de 2px atrás da captura. Os JPEGs existentes foram preservados; não houve nova imagem, biblioteca, animação contínua ou carregamento de motor na lista. O efeito tem aparência estática também sem suporte a backdrop-filter.

## Evidências desta revisão

- `npm run build -- --configLoader native`: aprovado, incluindo `tsc --noEmit`; 18 módulos transformados.
- `npm run check:build`: aprovado, 127 arquivos e 2.218.464 bytes.
- Playwright `home.spec.ts`, excluindo apenas o cenário que grava capturas na pasta da revisão anterior: **28/28 testes aprovados**, em 16,4 segundos. O cenário de capturas foi substituído por inspeção dirigida, sem editar os testes existentes.
- Verificação dirigida em **1440×1000, 393×851 e 320×900**: 15 linhas, 15 imagens carregadas, nenhuma sobreposição ou overflow horizontal, clique/Enter/toque abrem as faixas verificadas e o botão X retorna o foco à mesma âncora. Linhas com altura mínima de 91px no desktop e 80px no celular; toda a linha é a área clicável.
- Capturas inspecionadas em [screenshots/playlist-glass-2026-09-30](screenshots/playlist-glass-2026-09-30/), incluindo títulos longos e faixa 15 pendente. O vidro fica restrito às miniaturas e o texto mantém fundo sólido.

Não houve nova execução da suíte unitária nem de partidas completas nesta revisão de apresentação. A verificação móvel é emulada, sem aparelho físico; não houve medição nova de desempenho em rede real. Motores, IDs, conquistas, NFC e publicação permanecem com o comportamento anterior. Sem deploy, dependências ou configuração global.

# Revisão visual — 21/09/2026

Pedido: misturar a composição de catálogo musical da captura da Epidemic Sound com a profundidade visual do Spectrogram do Chrome Music Lab. Escopo permanece Entrega 1. Arte original, dados pendentes, pré-save, coleção, NFC e progresso local preservados. Nenhuma dependência, configuração global, MCP, jogo ou deploy foi acrescentado; AGENTS.md e configurações do projeto não foram alterados nesta revisão.

## Resultado

- Navegação em cápsula, painel de abertura carvão, chips de formato e capa inteira com sombra/interação existentes.
- Navegação secundária por âncoras reais, tracklist compacta e hierarquia de catálogo nas faixas/coleção.
- Estudo visual silencioso em SVG, com 42 camadas e controles de relevo, linhas, paleta e perspectiva. Não representa análise de áudio; essa limitação aparece no próprio painel. Alterações ocorrem somente por interação, sem renderização contínua, microfone ou pedidos de mídia.
- Paleta preto/vermelho mantida; cores adicionais são uma opção do estudo. Não foram copiados código, música, marcas ou imagens das referências.
- Botões nativos, estados pressionados, range rotulado, foco e alvos de toque de pelo menos 44 px nos controles novos.

Implementação em `index.html`, `src/main.ts`, `src/styles/reference-mix.css` e `src/ui/spectrum.ts`. O CSS base teve apenas limpeza de indentação; os estilos da revisão estão separados. Dados/configurações de conteúdo e módulos de acesso/progresso não precisaram mudar.

## Verificações efetivamente executadas

| Verificação | Resultado |
| --- | --- |
| `npm run build` | Código 0; inclui `tsc --noEmit`, seguido de Vite 8.3.0. |
| `npm run typecheck` | Código 0 na revisão; repetido pelo build final. |
| `npm run check:build` | Código 0; 10 arquivos, 950.237 B; sem originais, skills, áudio, ZIPs ou sourcemaps. |
| `npm test` | Código 0; 54 testes em 3 arquivos. |
| `npm run test:e2e` | Código 0; 36 testes, 18 desktop + 18 mobile emulado, 24,6 s na execução final. |
| CLI local Playwright, sessão isolada `psicoz-mix` | Reload e hash do JS final conferidos; navegação, controles, snapshots, screenshots e console. Zero erros/avisos no console da home. |
| `npm run test:performance` | Código 0 no build final; hashes conferidos; resultados e limites no relatório de carregamento. |

Os 30 testes de fluxo anteriores foram preservados. Os seis novos exercitam modos/paleta por teclado, mudança real da aparência/geometria, limites do range, controles a 320 px, toque emulado e ausência de alteração do progresso ou carregamento de mídia. O teste de overflow foi ampliado para 320, 768, 1024 e 1440 px. Pré-save, capa, foco/Escape, coleção, NFC/reload, reset, storage inválido/bloqueado e retry de imagem continuam cobertos.

O runner emitiu aviso de coexistência de `NO_COLOR`/`FORCE_COLOR` no ambiente; isso não foi erro da aplicação e não exigiu alterar configuração global.

Build final: `index-C47EdxRD.css` / `index-B1TBfVHw.js`. HTML SHA-256: `ce6fbe289f1a1e94924cc0790da3e020c154b9f5830a0a4a6a0e5542f549940c`.

## Inspeção visual

Capturas desktop/mobile abertas e examinadas: abertura, estudo em vermelho e multicolorido, painel de pré-save e coleção. Conferidos capa sem recorte, leitura, alinhamento, controles sem sobreposição e ausência de overflow. Uma limitação de altura achatava os picos do primeiro desenho; foi removida e substituída por escala uniforme, com nova captura do build final.

- [Abertura desktop](screenshots/mix-2026-09-21/opening-desktop.png) e [mobile](screenshots/mix-2026-09-21/opening-mobile.png)
- [Estudo em vermelho](screenshots/mix-2026-09-21/spectrum-red-desktop.png), [cores](screenshots/mix-2026-09-21/spectrum-color-desktop.png) e [mobile](screenshots/mix-2026-09-21/spectrum-color-mobile.png)
- [Pré-save mobile](screenshots/mix-2026-09-21/panel-mobile.png), [coleção desktop](screenshots/mix-2026-09-21/collection-desktop.png) e [coleção mobile](screenshots/mix-2026-09-21/collection-mobile.png)

As capturas históricas foram preservadas. A consulta ao experimento público do Music Lab registrou erros externos; a referência visual também foi fornecida pelo usuário. Esses erros não ocorreram na home local.

## Carregamento e limites

Abertura: 440.711 B desktop / 330.127 B mobile. Home completa: 803.051 B (0,766 MiB), CLS 0 nos perfis medidos. LCP local: 420 ms / 168 ms. Sem mídia, motor de jogo ou pedidos de terceiros. [Método, comparação e limitações](performance-mix-2026-09-21.md).

Chrome instalado, execução local sem limitação de CPU/rede; celular é emulado. Não foram testados aparelho físico, leitor de tela ou produção. Conteúdo editorial, títulos, links oficiais e arquivos continuam pendentes de aprovação; não há reprodução musical, pré-save efetivado ou download publicado.

As skills foram reutilizadas nas versões registradas, sem nova instalação: design, guidelines, CLI, performance, diagnóstico visual e verificação final. [Revisão de acessibilidade](accessibility-mix-2026-09-21.md) e [registro de fontes](skills-registry.md).

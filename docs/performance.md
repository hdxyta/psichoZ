# Carregamento — Entrega 1

> Registro histórico de 18/09/2026. Os dados originais foram preservados em [`performance-baseline-2026-09-18.json`](performance-baseline-2026-09-18.json); `performance-results.json` agora recebe a medição mais recente. A comparação da revisão visual está em [`performance-mix-2026-09-21.md`](performance-mix-2026-09-21.md).

Medição local de **18/09/2026, 01:49 UTC** (17/09, 22:49 em São Paulo). A home transferiu **0,628 MiB no desktop** e **0,523 MiB no mobile emulado** na abertura. Após rolar até o final e carregar as quatro artes exibidas, ambos chegaram a **0,762 MiB**, abaixo da meta inicial de 1,5 MiB do briefing nas condições deste ensaio. Não houve requisições de áudio, motor 3D ou fases.

Dados completos, requisições, cabeçalhos, posições de rolagem, árvore acessível e hashes do build: [`performance-results.json`](performance-results.json). Build medido: `index-B34ooTNE.css`, `index-BqhWcaUk.js`; HTML SHA-256 `51a04cfe51154567bd8ea6c1ed6c0c24d9a738c9973efc1572a85de39aeb163a`. Mudanças nesses arquivos pedem nova medição.

## Condições e método

- Windows, Node **20.20.0**, Chrome **153.0.8010.47** instalado, Playwright **1.63.0**, modo headless.
- Build de produção servido por Vite preview em `http://127.0.0.1:4173/`.
- Contexto novo e isolado por perfil; nenhum perfil pessoal. Cache desativado via CDP. Sem limitação artificial de CPU/rede; conexão local.
- Desktop **1440 × 1000**, DPR 1. Mobile **393 × 851**, DPR 2,75, viewport/toque emulados. Não é um teste físico em Pixel 7 nem uma simulação de sua CPU ou conexão.
- Primeira navegação, espera por rede ociosa/fontes e estabilização de 800 ms; captura antes de qualquer rolagem. Depois, rolagem progressiva até o fim, nova espera e captura. Por último, volta ao topo e **reload real do documento** com cache ainda desativado.
- Bytes somam `PerformanceNavigationTiming` do HTML e todas as entradas `PerformanceResourceTiming`; o documento não foi omitido. `transferSize` é a contagem informada pelo navegador, incluindo cabeçalhos; `encodedBodySize` registra os corpos codificados. Não são captura de pacotes ou faturamento. [Definição da API no MDN](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/transferSize).
- LCP e mudanças de layout coletados com `PerformanceObserver`; CLS usa a maior janela de sessão, desconsiderando mudanças com entrada recente. O LCP principal é o observado **antes da rolagem**. São amostras de laboratório local, sem classificação de experiência de campo. [LCP](https://web.dev/articles/lcp) e [CLS](https://web.dev/articles/cls), consultados em 18/09/2026.

## Resultados observados

| Perfil / etapa | Transferência, bytes | Corpos codificados, bytes | Entradas, incluindo HTML | LCP inicial / reload | CLS observado |
|---|---:|---:|---:|---:|---:|
| Desktop: abertura | 658.681 | 656.581 | 7 | 256 ms | 0 |
| Desktop: após rolagem completa | 799.003 | 796.603 | 8 | — | 0 |
| Desktop: reload no topo | 658.681 | 656.581 | 7 | 64 ms | 0 |
| Mobile emulado: abertura | 548.097 | 546.297 | 6 | 152 ms | 0 |
| Mobile emulado: após rolagem completa | 799.003 | 796.603 | 8 | — | 0 |
| Mobile emulado: reload no topo | 548.097 | 546.297 | 6 | 64 ms | 0 |

A capa escura de 1200 px foi o elemento LCP nos dois perfis. FCP foi 256 ms no desktop e 152 ms no mobile emulado. O reload foi identificado pela API como `type: "reload"`; as duas capturas de reload estavam no topo. Ao final da rolagem: desktop `4708 + 1000 = 5708` px e mobile `6685 + 851 = 7536` px, confirmando chegada ao fim da página.

Todos os pedidos registrados retornaram **200**. O script terminou com código **0**, sem erro de página, console ou requisição. Nenhuma amostra substitui uma distribuição de visitas reais: os tempos pequenos são favorecidos pelo servidor local, e a diferença entre abertura e reload não demonstra benefício de cache, pois ele estava desativado.

## Rede, imagens e bundle

As imagens secundárias têm `loading="lazy"`, mas isso não significa esperar exatamente pelo aparecimento na tela. Neste Chrome, a capa clara já foi antecipada na abertura dos dois perfis; a contracapa escura também foi antecipada no desktop. Depois de rolar, entrou somente `back-light-900.webp` no desktop (**140.322 bytes transferidos**); no mobile entraram as duas contracapas (**250.906 bytes**). O registro distingue essas requisições das da abertura.

As duas resoluções da capa não foram baixadas juntas. Estes perfis escolheram 1200 px — no mobile, a densidade é 2,75. A versão 640 px continua disponível para o navegador selecionar em outras condições; não houve alegação de medição dela neste ensaio.

| Recurso | Arquivo em disco | Corpo codificado observado |
|---|---:|---:|
| HTML | 10.742 B | 3.659 B |
| JavaScript | 13.967 B | 5.404 B |
| CSS | 15.100 B | 4.256 B |
| Fonte WOFF2 | 17.280 B | 17.280 B |

O preview enviou gzip para HTML, JS e CSS. Imagens WebP e WOFF2 já usam seus formatos comprimidos. Os cabeçalhos de cache locais foram `no-cache`; isso descreve o preview, **não valida cache de uma hospedagem futura**. Não há fontes, scripts analíticos ou outros pedidos de terceiros nesta medição.

Foram listados e hashados os **10 arquivos de `dist/`**, total **935.260 bytes**. A saída contém HTML, JS, CSS, cinco WebPs, WOFF2 e a licença OFL. Não contém `source-art/`, documentação/vendor de skills, `node_modules/`, áudio ou masters. A leitura dos imports, catálogo de dependências e requisições confirma que o motor 3D e o áudio não fazem parte da abertura. O jogo não foi implementado.

O pipeline de arte já reduziu os cinco derivados de **1.608.824 bytes** no ensaio lossless para **873.636 bytes** no resultado final, com inspeção visual; detalhes em [`assets.md`](assets.md). Essa é uma comparação de arquivos, não uma comparação de tempos antes/depois do site. Não existe um benchmark de uma versão anterior da home.

## Investigação do aviso de preload

Um aviso intermitente de fonte pré-carregada e supostamente não usada foi relatado na sessão exploratória separada. Aplicada `systematic-debugging`: a hipótese investigada foi fonte não consumida ou requisição duplicada. O script passou a capturar avisos, estado de `document.fonts`, fontes realmente renderizadas via CDP e uma visita NFC, esperando mais de cinco segundos em cada inspeção normal/NFC.

O aviso **não foi reproduzido** nos dois perfis deste ensaio. Evidências: uma única requisição WOFF2 por navegação, iniciador `link`, 17.280 bytes; `document.fonts.status = "loaded"`; verificação do peso 700 verdadeira. `CSS.getPlatformFontsForNode` confirmou a fonte personalizada **UnifrakturCook-Bold** no título principal (6 glifos) e no título da coleção (12 glifos), tanto na visita normal quanto NFC. Não foi encontrada duplicação nem falha de fonte. Nenhuma alteração de preload foi feita com base no aviso; a causa da ocorrência intermitente da outra sessão permanece não confirmada.

## Cenários de volume

Hipóteses de cálculo: **uma visita por visitante e uma navegação por visita**, nenhum reload, sem áudio/jogo/downloads, navegador sem cache. A coluna de abertura usa divisão hipotética **50% desktop / 50% mobile**, média de **603.389 bytes por visita**. A coluna completa usa **799.003 bytes por visita**, supondo que todas as pessoas rolem até o final. GiB = 1.073.741.824 bytes.

| Visitantes / visitas sob essas hipóteses | Abertura, GiB | Página completa, GiB | Requisições na abertura / página completa |
|---|---:|---:|---:|
| 1.000 | 0,562 | 0,744 | 6.500 / 8.000 |
| 1.500 | 0,843 | 1,116 | 9.750 / 12.000 |
| 10.000 | 5,619 | 7,441 | 65.000 / 80.000 |

Esses volumes não são acessos simultâneos: dez mil visitas distribuídas ao longo de dias diferem de dez mil no mesmo instante. Uma visita adicional ou reload aumenta o total; cache no navegador pode reduzi-lo. Cache de CDN afeta pedidos na origem e latência, mas não elimina necessariamente os bytes enviados ao visitante. Não houve ensaio de concorrência ou carga na hospedagem.

**R2 não foi usado e não houve operações R2 nesta entrega.** No futuro, contabilizar separadamente quantos objetos estarão no R2, downloads efetivos, bytes por arquivo e pedidos que chegam à origem após a política de cache. Músicas/ZIPs podem dominar esse volume e não estão incluídos nas estimativas. Não há estimativa de custo, promessa de capacidade ou garantia de gratuidade. O processamento da interface e, futuramente, do jogo também depende da capacidade de cada aparelho.

## Reprodução e limites

Em um terminal, `npm run build` e `npm run preview -- --port 4173`; em outro, `node scripts/measure-performance.mjs`. O script foi lido/revisado e passou por `node --check` antes de executar. Lê o build, abre Chrome isolado, coleta dados locais e grava somente `docs/performance-results.json`. Não instala pacotes, acessa perfis pessoais ou envia conteúdo a um serviço. A aplicação deve estar pronta no preview antes da medição.

`web-perf` foi consultada e aplicada ao bundle, rede, árvore acessível e métricas disponíveis. A descoberta de ferramentas não encontrou DevTools MCP/trace: nenhum MCP foi adicionado. CDP foi usado apenas pelo navegador isolado já instalado, para cache e diagnóstico de fonte. A árvore acessível capturada apresenta navegação, títulos, regiões, imagens e nomes dos controles; testes de interação e revisão visual da home pertencem ao relatório de verificação da entrega.

Não foram executados Lighthouse, trace do DevTools, INP/TBT, teste em aparelho real, medição de FPS, benchmark estatístico, CDN/R2, cache em produção ou carga simultânea. Os resultados não demonstram Core Web Vitals de usuários reais. A revisão de publicação deverá medir domínio/rede/aparelhos reais e a carga dos downloads autorizados quando existirem.

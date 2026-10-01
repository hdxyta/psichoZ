# Carregamento da revisão visual — 21/09/2026

`npm run test:performance` executado com **código 0** em **21/09/2026, 19:33 UTC (16:33 em São Paulo)**, após os ajustes finais de cor do navegador e alvos de toque. Abertura: **440.711 bytes no desktop** e **330.127 bytes no mobile emulado**. Após percorrer toda a home: **803.051 bytes (0,766 MiB)** em ambos, incluindo o documento HTML. A meta inicial de 1,5 MiB permanece atendida neste ensaio local.

Dados desta revisão, preservados antes de desenvolver o jogo: [`performance-home-mix-baseline-2026-09-21.json`](performance-home-mix-baseline-2026-09-21.json). A captura de 18/09 foi preservada sem alteração em [`performance-baseline-2026-09-18.json`](performance-baseline-2026-09-18.json), SHA-256 `3aacddffb78e6e5a428474792af08ac384d6a945ab96108c532738fef5bdfeb4`. O relatório [`performance.md`](performance.md) permanece histórico.

## Comparação das capturas

| Medida | 18/09 | 21/09 | Diferença |
|---|---:|---:|---:|
| Desktop: transferência inicial | 658.681 B | 440.711 B | −217.970 B (−33,1%) |
| Mobile emulado: transferência inicial | 548.097 B | 330.127 B | −217.970 B (−39,8%) |
| Home completa, ambos os perfis | 799.003 B | 803.051 B | +4.048 B (+0,51%) |
| Desktop: LCP inicial | 256 ms | 420 ms | +164 ms |
| Mobile emulado: LCP inicial | 152 ms | 168 ms | +16 ms |
| Desktop/mobile: CLS inicial | 0 / 0 | 0 / 0 | Sem mudança observada |
| Arquivos de `dist/`, em disco | 935.260 B | 950.237 B | +14.977 B |

As imagens mantêm exatamente os mesmos hashes. Na captura antiga a capa clara era antecipada na abertura. Com a nova disposição ela só foi pedida após a rolagem, reduzindo a transferência inicial em 222.018 bytes; o crescimento de 4.048 bytes no conjunto HTML/CSS/JS resulta na redução líquida de 217.970 bytes. A economia inicial decorre desse adiamento, não de uma nova compressão das artes.

No desktop, a abertura atual fez 6 pedidos; a rolagem acrescentou a capa clara e a contracapa clara. No mobile, foram 5 pedidos iniciais e as três imagens secundárias entraram durante a rolagem. A página completa somou 8 entradas em ambos os casos. `loading="lazy"` continua sujeito à antecipação do navegador; estes números descrevem os perfis medidos.

## Método e resultados adicionais

Mesmo script de 18/09, sem alterações: Chrome headless isolado, cache desativado, preview de produção em `http://127.0.0.1:4173`, sem limitação artificial de CPU/rede. Desktop **1440 × 1000/DPR 1**; mobile **393 × 851/DPR 2,75**, com toque emulado. A transferência soma `PerformanceNavigationTiming` e `PerformanceResourceTiming`; LCP/CLS vêm de `PerformanceObserver`. Espera por rede/fontes, rolagem progressiva completa, retorno ao topo e reload real.

O ambiente mudou de Node **20.20.0 → 24.15.0** e Chrome **153.0.8010.47 → 153.0.8010.52**. Os tempos são uma amostra por perfil, obtida em dias distintos. O LCP inicial aumentou, mas estas capturas não isolam a causa nem demonstram regressão estatística atribuível ao redesign. A capa escura de 1200 px continua sendo o elemento LCP.

Corpos codificados atuais: abertura **438.911 B desktop / 328.627 B mobile**; home completa **800.651 B**. No reload, a transferência inicial permaneceu igual; LCP foi **88 ms desktop / 72 ms mobile**, CLS 0. CLS também ficou em 0 após a rolagem completa. As capturas finais chegaram ao fundo: desktop `4870 + 1000 = 5870` px; mobile `6997 + 851 = 7848` px.

Todos os pedidos observados retornaram **200** e ficaram na origem local. **Zero erros de console/página/requisição, zero avisos, zero pedidos de áudio, fases, modelos 3D ou motor**. O estudo espectral usa SVG local e não acrescentou pedidos de mídia. O diagnóstico normal/NFC também terminou sem avisos de preload; a fonte foi carregada e renderizada.

## Integridade e limites

Os 10 arquivos de `dist/` foram listados e seus hashes comparados novamente após a execução: correspondem ao build **`index-C47EdxRD.css` / `index-B1TBfVHw.js`**. HTML SHA-256: `ce6fbe289f1a1e94924cc0790da3e020c154b9f5830a0a4a6a0e5542f549940c`. A saída não inclui originais, documentação/vendor de skills ou masters. JS/CSS têm respectivamente **17.447/24.418 B em disco**, **6.831/6.278 B codificados** no preview.

Nenhuma instalação, alteração no script/app ou configuração global foi necessária para esta medição. Não foram medidos aparelho físico, rede móvel real, INP/TBT, carga simultânea, CDN/R2 ou produção. Os resultados são laboratório local, sem equivalência com experiência de campo ou promessa de desempenho. Os cenários de tráfego do relatório anterior continuam sendo hipóteses históricas baseadas nos bytes de 18/09.

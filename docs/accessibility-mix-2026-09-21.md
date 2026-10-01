# Revisão da composição e do estudo visual — 21/09/2026

Revisão estática usando as versões já fixadas de `frontend-design`, `web-design-guidelines` e [command.md](vendor-skills/vercel-labs/web-interface-guidelines/command.md). Nenhuma instalação, atualização de skill ou mudança de aplicativo foi feita por esta revisão.

## Resultado

Nenhum bloqueio de acessibilidade foi identificado no código novo inspecionado. O espectro é apresentado honestamente como estudo gráfico silencioso; os controles não simulam reprodução musical, análise de uma faixa ou conquista no jogo. Testes de navegador e inspeção visual são evidências separadas desta leitura.

## Conferências com localização

| Local | Conferência |
| --- | --- |
| `index.html:25`, `index.html:49` | Novos acessos usam âncoras reais; a navegação secundária tem nome distinto. O header não é fixo/sticky, portanto não acrescenta sobreposição nas âncoras. |
| `index.html:40` | Capa inteira e botão acessível preservados, assim como `data-open-presave` e `#cover-button`. |
| `index.html:52`, `index.html:64` | “Estudo visual · sem áudio” e explicação de que as formas não representam o áudio das faixas ficam visíveis. Não há eixos em Hz/dB, duração fabricada ou progresso de reprodução. |
| `index.html:54` | SVG decorativo usa `aria-hidden="true"` e `focusable="false"`; as muitas linhas desenhadas não poluem a árvore acessível. |
| `index.html:56` | Controles agrupados com nome acessível; botões Relevo, Linhas e Cores do espectro são elementos nativos, com texto e `aria-pressed`. Ícones são decorativos. |
| `src/ui/spectrum.ts:103` | Estado pressionado é atualizado para cada modo e para a paleta; rótulos não mudam de significado ao alternar. |
| `index.html:61`, `src/ui/spectrum.ts:81` | Range tem label envolvente “Perspectiva”, nome, valor inicial e limites −20/20. O código restringe valores válidos e expõe `aria-valuetext` em graus. Setas, Home e End são fornecidos pelo controle nativo. |
| `src/styles/reference-mix.css:93`, `src/styles/reference-mix.css:98`, `src/styles/reference-mix.css:156` | Botões do espectro, range e link adicional do header mobile têm altura mínima de 44 px. Foco visível global é preservado em `src/styles/main.css:67`. Valores relidos após o ajuste dos alvos de toque. |
| `src/styles/reference-mix.css:96` | Texto branco sobre botão pressionado `#bf263b`: **5,91:1**, acima de 4,5:1 para texto pequeno. Cálculo por luminância sRGB das cores declaradas. |
| `src/styles/reference-mix.css:93`, `src/styles/reference-mix.css:99` | Texto do botão em repouso: **10,01:1** (`#d5ccd8`/`#26222a`). Nota explicativa: **7,17:1** (`#a99fae`/`#151518`). |
| `src/ui/spectrum.ts:123`, `src/ui/spectrum.ts:133` | Alterações ocorrem apenas por click/input. Não há `requestAnimationFrame`, timer, áudio, microfone, fetch ou renderização contínua nesse módulo. O desenho estático não exige controle para pausar animação. |
| `src/ui/spectrum.ts:138` | Desmontagem aborta listeners e remove paths/gradiente. Montagem ocorre uma vez em `src/main.ts:282`, fora da renderização da coleção. |
| `src/styles/main.css:634`, `src/styles/main.css:807` | Preferência local e `prefers-reduced-motion` permanecem disponíveis. O novo SVG não acrescenta transições ou loops que precisem ser anulados. |
| `src/main.ts:132`, `src/main.ts:150` | As 15 posições, IDs e estados de acesso permanecem. Indicador de áudio é decorativo e não interativo; texto visível informa “Áudio em breve”. Não existe botão de play/seek falso. |
| `index.html:86`, `index.html:96`, `index.html:97` | IDs da coleção e dialogs preservados. O redesign não altera os dados de NFC, o reset, a publicação dos arquivos ou as conquistas. |

## Ajuste menor resolvido

`index.html:6` foi alinhado para `theme-color="#101012"`, igual ao novo fundo em `src/styles/reference-mix.css:3`. Correção relida: não resta divergência de cor declarada entre a página e a barra do navegador móvel.

## Regressão e limites

Foram lidos `tests/e2e/home.spec.ts` e `tests/e2e/spectrum.spec.ts`. Os testes novos cobrem alternância por Enter/Space, estado `aria-pressed`, range por teclado e limites, geometria finita, viewport de 320 px, preferência de movimento reduzido e ausência de áudio/jogo/alteração de progresso. Os testes existentes mantêm capa, foco/fechamento dos dialogs, NFC/reload, armazenamento, reset, falha de imagem e overflow.

Esta revisão não executou essa suíte nem declara que seus casos passaram. Os resultados e screenshots atuais devem ser lidos no relatório de verificação do redesign. Não foram testados leitor de tela ou aparelho físico aqui; cálculo de contraste de CSS não substitui a inspeção visual renderizada.

# Revisão de interface e acessibilidade — Entrega 1

Aplicadas `web-design-guidelines` e a referência [command.md preservada](vendor-skills/vercel-labs/web-interface-guidelines/command.md), commit `e3d624baaf29dc1fc645aff3e38f03e564d2d6b1`. Revisão estática de `index.html`, `src/styles/main.css` e `src/main.ts`, com releitura das correções. Os testes de navegador e screenshots pertencem à verificação da entrega; esta revisão não equivale a auditoria completa de leitor de tela ou teste físico.

## Achados corrigidos

| Local atual | Impacto encontrado | Correção relida |
| --- | --- | --- |
| `src/styles/main.css:172` | Hover do botão primário reduzia contraste do texto para **4,26:1**. | Fundo `#b81825` com texto branco: **6,57:1**, além de contorno claro. Repouso: **5,39:1**. Valores calculados pela luminância sRGB das cores declaradas. |
| `src/styles/main.css:323` e `src/styles/main.css:337` | Títulos futuros longos poderiam ampliar a tracklist além da largura disponível. | Coluna `minmax(0,1fr)`, `min-width:0` e `overflow-wrap:anywhere` no nome, incluindo crédito descendente. |
| `src/main.ts:224` e `src/styles/main.css:820` | `hidden` da imagem podia ser sobreposto por `img{display:block}`. | `[hidden]{display:none!important}` preserva a exibição exclusiva do fallback. |
| `src/main.ts:233` | Retry removia o próprio botão focado e perdia a posição do teclado. | Botão permanece durante a tentativa; sucesso transfere foco à imagem/capa, falha devolve foco ao retry. |
| `src/main.ts:234` | Repetir falhas deixava listeners `load` pendentes. | Cada tentativa usa `AbortController`; tanto sucesso (`:239`) quanto erro (`:247`) chamam `abort()`, removendo os dois listeners associados. |
| `src/main.ts:33` | Contato aprovado sozinho mantinha placeholder dizendo que o contato ainda seria anunciado. | Placeholder é limpo quando existe qualquer rede ou contato aprovado. |
| `src/main.ts:36` e `src/main.ts:37` | Campos de contato e foto aprovados não eram renderizados. | Contato com URL validada; foto opcional com dimensões, alt e carga lazy, incluída no tratamento de falhas das imagens. Ausência de foto preserva o layout. |
| `src/main.ts:177` | Teste de Tab revelou saída do ciclo esperado de foco no dialog nativo. | Loop explícito para Tab/Shift+Tab entre primeiro e último controle visível e habilitado; Escape e retorno de foco permanecem nativos/evento `close`. Regressão em `tests/e2e/home.spec.ts:41`. |

Todos os achados de implementação listados acima foram corrigidos no código relido. O agente principal registrou 30 casos E2E aprovados após a correção do ciclo de foco; a execução final e seus resultados consolidados ficam em `docs/verification.md`.

## Conferências do código final

- `index.html:2`, `index.html:5`: `pt-BR`, viewport sem bloquear zoom.
- `index.html:19`: atalho para conteúdo e navegação por âncoras HTML; logotipo com nome acessível.
- `index.html:29`, `index.html:39`: um `h1`; capa completa em botão nativo com nome acessível e indicação de painel; imagem descrita, dimensionada, responsiva e prioritária.
- `index.html:49`, `index.html:60`, `index.html:63`: artes secundárias descritas e dimensionadas, com `loading="lazy"`; jogo explicitamente em desenvolvimento.
- `index.html:65`, `index.html:69`: estados da coleção/armazenamento com regiões de status, checkbox rotulado e confirmação para apagar dados; NFC claramente distinto de conquista.
- `index.html:75`, `index.html:76`: diálogos com nome/descrição e controles nomeados. Foco inicial em fechar/cancelar; o `autofocus` de “Manter progresso” é a opção segura e não aciona teclado virtual.
- `src/styles/main.css:28`, `src/styles/main.css:67`, `src/styles/main.css:159`, `src/styles/main.css:571`: `touch-action:manipulation`, foco visível e controles principais com altura de 44–50 px.
- `src/styles/main.css:1`, `src/styles/main.css:7`: fonte local com `font-display:swap` e tema escuro declarado.
- `src/styles/main.css:66`, `src/styles/main.css:130`, `src/styles/main.css:332`: margem nas âncoras e números tabulares em datas/posições.
- `src/styles/main.css:205`, `src/styles/main.css:634`, `src/styles/main.css:807`: capa se move em resposta ao hover, transição limitada a `transform`; redução de movimento do sistema e preferência local são respeitadas.
- `src/styles/main.css:547`, `src/styles/main.css:817`: dialog com overflow contido e safe-area lateral respeitada.
- `src/main.ts:16`: data centralizada com `Intl.DateTimeFormat` e `datetime`; relógio do visitante não publica o álbum.
- `src/main.ts:48`, `src/main.ts:71`: links aprovados com proteção da aba externa e nome acessível; URLs ausentes apresentadas como pendência, sem fingir campanha oficial.
- `src/main.ts:169`, `src/main.ts:177`: abertura por `showModal`, foco inicial, ciclo de teclado explícito, Escape e restauração de foco ao fechar.
- `src/main.ts:195`: reset exige confirmação e remove marcador NFC da URL para impedir restauração involuntária no reload.
- `src/main.ts:220`, `src/main.ts:260`: fallback com status e retry é irmão do botão da capa, sem aninhar controles interativos.
- `src/config/site.ts`, `src/data/catalog.ts`: dados desconhecidos permanecem `null`; nenhum nome de artista, título, crédito, URL oficial ou áudio foi inventado.

## Pendências de conteúdo e limites

`index.html:12`: `og:image` relativo é adequado como referência local provisória; URL social absoluta depende do domínio aprovado, já registrado em `content-checklist.md`. Isso é uma pendência de publicação, não uma falha de interação da home.

A revisão final de navegador distingue desktop, viewport/toque emulado e aparelho real. Não foi executada auditoria completa com leitor de tela nem validação de metadata em domínio público. As métricas disponíveis, condições de ensaio e ausências de medição estão em `performance.md`; os fluxos e screenshots estão na verificação da entrega.

# Verificação — Entrega 1

Relatório histórico da entrega inicial. A composição posterior e suas evidências estão na [revisão visual de 21/09](verification-mix-2026-09-21.md).

Encerramento em 17/09/2026, horário de São Paulo (18/09 UTC). Escopo: home e base funcional. Nenhum jogo, deploy, envio de masters, commit, push ou PR. A pasta de trabalho estava vazia e sem Git: não havia código, AGENTS.md ou configuração a sobrescrever. Foi criado somente o projeto local solicitado, com um AGENTS.md curto e as cópias do briefing em docs/.

## Resultado atual

Home com as quatro artes reais, capa completa com hover/sombra e botão equivalente, apresentação separada de álbum/artista, painel de pré-save/escuta, 15 posições, coleção, NFC e progresso local. Todas as informações sem aprovação continuam como pendências explícitas. O jogo aparece em desenvolvimento, sem áudio, engine ou gameplay simulado.

## Comandos efetivamente executados

| Verificação | Resultado final |
|---|---|
| `npm ci --ignore-scripts --offline=false --cache .npm-cache` | Passou: 61 pacotes, auditoria npm sem vulnerabilidades reportadas. Cache e dependências locais. |
| `npm run typecheck` | Passou, exit 0. |
| `npm test` | Passou: **54 testes**, 3 arquivos, Vitest 4.1.11, exit 0. |
| `npm run build` | Passou, Vite 8.3.0, exit 0, sem warnings do build final. |
| `npm run check:build` | Passou: **10 arquivos / 935.260 bytes**, sem originais, skills, áudio, ZIPs ou sourcemaps. |
| `npm run test:e2e` | Passou: **30 testes**, 15 desktop + 15 mobile emulado, **16,7 s**, exit 0. |
| `node scripts/prepare-assets.mjs` | Passou; cinco WebPs e manifesto, originais/fonte/licença preservados e hashados. |
| `node scripts/measure-performance.mjs` | Passou no build final correspondente: rede, bytes, LCP/CLS local e ausência de engine/áudio. Ver performance.md. |
| `node --check scripts/measure-performance.mjs` | Passou. |
| CLI local `playwright-cli --help`, sessão `psicoz-review` | Comandos reais conferidos. Chrome isolado aberto, navegação, snapshot, screenshot, clique, Escape/Tab, leitura de foco/storage e rede executados. |

Build final: CSS `index-B34ooTNE.css`, JS `index-BqhWcaUk.js`; HTML SHA-256 `51a04cfe51154567bd8ea6c1ed6c0c24d9a738c9973efc1572a85de39aeb163a`. A reconstrução após `npm ci` produziu exatamente os mesmos hashes/bytes do ensaio de performance; a formatação do CSS fonte não mudou o bundle medido.

Também foi executado um build temporário com `VITE_ASSET_BASE_URL=https://assets.example.test/psicoz-v1` em `.asset-base-check/`: imagens, imagem social e todos os candidatos do srcset usaram o prefixo, enquanto JS/CSS ficaram locais. É um domínio de exemplo, sem requisição ou publicação remota. Esse diretório está no gitignore e não integra dist/.

## Critérios exercitados

- Home/seções acessíveis por âncoras, incluindo voltar/avançar; lista textual com 15 IDs e posição 15 “A anunciar”.
- Capa completa com clique, toque emulado, Enter e Space; painel nomeado, links pendentes desabilitados, foco inicial, ciclo de Tab/Shift+Tab, fechamento por Escape e retorno ao acionador.
- NFC por URL, coleção ao entrar, persistência no reload, zero fases/conquistas artificiais e arquivos não publicados indisponíveis.
- JSON corrompido e versão futura preservados; fallback em memória com mensagem; leitura e gravação de storage bloqueadas sem derrubar a home.
- Migração v1 compatível, validação de IDs/URLs, separação de acesso/publicação/estado editorial; reset cancelado e confirmado, confinado à chave do projeto.
- Movimento reduzido do sistema e preferência local persistente; rota reservada do jogo honesta e tolerante a reload.
- Erro 404 de imagem opcional, mensagem, retry bem-sucedido e funcionamento do restante da página.
- Sem overflow horizontal a 320 e 1440 px; diálogos dentro do viewport; nenhum canvas, áudio, download inexistente ou pedido de engine na abertura.

## Revisão visual

Capturas finais em [screenshots](screenshots/): [home desktop](screenshots/home-desktop.png), [home mobile](screenshots/home-mobile.png), [painel desktop](screenshots/panel-desktop.png), [painel mobile](screenshots/panel-mobile.png), [coleção desktop](screenshots/collection-desktop.png), [coleção mobile](screenshots/collection-mobile.png). O CLI também registra a abertura móvel em 390 × 844.

As capturas foram abertas e inspecionadas: capa inteira e separada do texto; lettering original sem recorte; variantes claras com traço preservado; textos de corpo legíveis, seções com hierarquia, estados de coleção coerentes e painel móvel sem cortes. No desktop, texto e capa ocupam áreas distintas; no mobile, se empilham. A composição é uma proposta implementada, ainda sujeita à revisão artística do usuário.

Uma primeira captura de elemento alto mostrava o skip link fixo no recorte. A investigação confirmou foco correto no acionador e `top:-100px`: era artefato do screenshot de elemento maior que o viewport. As capturas finais da coleção usam viewport real, sem ocultar elementos por código ou CSS de teste.

## Falhas encontradas e correções verificadas

Aplicada `systematic-debugging`, sem atualizações aleatórias de dependências:

1. **npm ENOTCACHED:** ambiente padrão forçava leitura somente de cache; consulta/instalação local autorizada resolveu, sem alterar npm global.
2. **Vite spawn EPERM:** a inicialização do resolvedor Windows invocava subprocesso bloqueado; execução aprovada resolveu. Nenhuma alteração de arquitetura ou sandbox global.
3. **Foco no painel:** dois testes falharam; CLI e diagnóstico reproduziram `document.activeElement=BODY` após Tab com um único botão ativo. Foi adicionado ciclo explícito nos limites do diálogo. Os mesmos testes passaram sem enfraquecer assertions.
4. **Configuração de assets:** build de teste revelou JS/CSS enviados ao prefixo remoto e srcset mantido local. A transformação passou à fase anterior ao processamento do HTML pelo Vite. O caso repetido confirmou os destinos corretos.
5. **Revisão de interface:** contraste de hover corrigido de 4,26:1 para 6,57:1; títulos longos protegidos; `hidden` respeitado pelo CSS; retry conserva foco e remove listeners por tentativa; foto/contato opcionais renderizados. Detalhes em accessibility-review.md.
6. **npm ci EPERM:** o preview mantinha o binário nativo Rolldown em uso. Encerrado somente o preview criado nesta tarefa; nova execução de npm ci passou. Nenhuma permissão do Windows foi alterada.

Uma tentativa exploratória de clique em referência antiga do snapshot falhou; após nova navegação foi usado o seletor observado `#cover-button`, com sucesso. Uma leitura de atributo via CLI teve erro de aspas no Windows; repetida via `document.activeElement.ariaLabel`, confirmou “Fechar painel de pré-save” após Tab. O CLI ocasionalmente relatou preload da fonte não consumido; investigação isolada confirmou uma requisição e fonte real renderizada, mas não reproduziu o aviso (performance.md). Os testes imprimiram somente avisos de ambiente NO_COLOR/FORCE_COLOR; não são erros da aplicação.

## Skills e limites

As seis skills solicitadas foram lidas/aplicadas a partir das fontes originais fixadas, com licenças e referências preservadas em `docs/vendor-skills`. Não estão instaladas globalmente nem foram registradas automaticamente no catálogo: são instruções locais consultadas nesta entrega. `frontend-design` guiou composição; `web-design-guidelines` e sua referência externa guiaram revisão; `playwright-cli` foi executada; `web-perf` guiou medições disponíveis; `systematic-debugging` guiou falhas; `verification-before-completion` guiou o encerramento. [Registro exato](skills-registry.md).

Sem aparelho físico, Safari/Firefox, leitor de tela completo, Lighthouse, trace DevTools, INP/TBT, teste de concorrência, R2/CDN ou métricas reais de produção. Links oficiais e arquivos publicados ainda não existem na configuração: não houve teste real de pré-save externo, salvamento de download ou escuta. Os futuros downloads entre domínios dependem dos headers dos objetos e devem ser verificados na publicação. Não há gameplay/FPS a avaliar.

Resultado: **base visual e funcional verificada localmente**; jogo não implementado; lançamento público ainda depende do conteúdo aprovado, testes de dispositivos e autorização de publicação.

# psicoZ — Prompt de desenvolvimento para o Codex · v3 com skills

Briefing atualizado: 15 músicas; home completa; capa interativa; pré-save externo; coleção digital; jogo em primeira pessoa inspirado nas artes; acesso imediato pela URL do mini CD NFC.

**Como executar:** coloque este arquivo e as quatro imagens de referência no repositório. Use o prompt abaixo como briefing mestre. A primeira execução entrega a home e a base funcional; o jogo é implementado na segunda entrega, antes da expansão do conteúdo. Este arquivo especifica o projeto — não contém uma plataforma já implementada.

**Nesta versão:** seleção de skills de fontes originais no GitHub, ativação por etapa, cuidados de instalação, tratamento de conflitos com a stack e critérios de evidência. O briefing de produto da v2 foi preservado. Nenhuma instalação no ambiente do usuário foi executada aqui.

---

## PROMPT MESTRE — COPIAR A PARTIR DAQUI

Atue como desenvolvedor sênior de frontend e jogos para navegador, com atenção à direção de arte. Desenvolva a plataforma oficial do meu álbum **psicoZ**.

Quero um site musical autoral, não um template de empresa, nem uma demonstração genérica de jogo. A experiência deve parecer um encarte de álbum que ganhou vida: a pessoa conhece o projeto, faz o pré-save, explora suas imagens e pode jogar para conquistar músicas e materiais digitais.

Leia este briefing inteiro, inspecione o repositório e apresente um plano curto antes de implementar. Respeite o escopo da primeira execução definido no final. Não entregue apenas planejamento.

### 0. Skills selecionadas no GitHub e regras de utilização

Use skills de agentes como orientação de desenvolvimento, não como dependências do site. As skills não devem ser importadas no JavaScript publicado nem adicionadas ao `package.json` como se fossem bibliotecas do jogo. Ferramentas exigidas por uma skill são uma decisão separada, restrita ao desenvolvimento.

Esta seleção foi feita pela adequação ao psicoZ, pela existência de instruções verificáveis e pela preferência por fontes originais. Não é um ranking por estrelas, um benchmark comparativo ou uma garantia de código correto. Os arquivos públicos foram consultados em 17/09/2026. Revalide nomes, caminhos, referências e compatibilidade ao preparar o ambiente.

#### 0.1. Decisões do produto continuam valendo

As sugestões genéricas das skills não substituem este briefing nem autorizam ampliar o escopo. Preserve HTML + CSS + TypeScript + Vite, Three.js somente no jogo, Pages + R2, 15 faixas, progresso local e ausência de cadastro/backend.

Não troque a identidade artística por uma estética sugerida por exemplos da skill. Preto e vermelho são escolhas do álbum, não um convite para uma página genérica com acento neon. O lettering e as artes originais continuam sendo as referências principais.

Não instale todas as skills de um repositório para resolver uma tarefa pequena. Acione somente as relacionadas à etapa atual. A home continua sendo a primeira entrega; consultar skills de jogos não autoriza começar 15 fases antes dela.

#### 0.2. Catálogo principal e aplicação no projeto

**A. `frontend-design` — `anthropics/skills`**

Origem: `skills/frontend-design/SKILL.md` [S1].

Use na composição da home e no polimento visual. Para o psicoZ, produza um pequeno conjunto de variáveis CSS, hierarquia tipográfica e composição baseada nas capas. Aplique à abertura, ao destaque da capa, ao painel de pré-save, à apresentação do artista e à coleção. Revise o resultado em screenshots. Não invente biografia ou texto oficial para cumprir sugestões de copy da skill.

Entrega esperada: layout desktop/mobile coerente com as artes e breve registro das decisões em `docs/design-direction.md`. Não crie uma etapa interminável de pesquisa visual: estabeleça a direção e implemente.

**B. `web-design-guidelines` — `vercel-labs/agent-skills`**

Origem: `skills/web-design-guidelines/SKILL.md` [S2].

Use depois de implementar componentes de interface. Confira foco, teclado, leitura, comportamento do painel, alvos de toque, responsividade e movimento reduzido. Leia também as diretrizes externas para as quais a skill aponta, registrando a versão/data consultada [S3]. Sem acesso a essa referência, registre a limitação; não declare uma auditoria completa só por ler o arquivo curto da skill.

Entrega esperada: achados concretos com arquivo/linha, impacto no visitante e correção. Não transforme essas diretrizes em exigência de React, Next.js ou hospedagem Vercel.

**C. `playwright-cli` — `microsoft/playwright-cli`**

Origem: `skills/playwright-cli/SKILL.md` [S4].

Use para explorar o site em um navegador, inspecionar a interface renderizada, executar interações, capturar screenshots e investigar console/rede. No psicoZ, cubra clique na capa, abertura/fechamento do painel, âncoras, coleção, URL NFC, reload e falhas de arquivos.

O CLI é ferramenta exploratória do agente. A suíte de regressão do repositório continua em TypeScript com `@playwright/test`, além dos testes unitários em Vitest. Não considere uma sessão interativa um substituto dos testes versionados.

Reutilize ferramentas e versões existentes quando compatíveis. Verifique os comandos realmente oferecidos pela versão instalada antes de copiá-los da documentação. Não adicione instalação global, extensão de navegador ou acesso ao perfil pessoal sem autorização. Use um contexto de teste isolado e assets de demonstração.

**D. `web-game-foundations` — `openai/plugins`, pacote Game Studio**

Origem: `plugins/game-studio/skills/web-game-foundations/SKILL.md` [S5].

Use no começo da Entrega 2 para definir limites entre simulação, renderização, entrada, áudio, interface e progresso. Registre somente decisões necessárias à primeira fase. A stack já foi escolhida: não reabra a seleção do motor sem um impedimento concreto.

Entrega esperada: regras do jogo independentes de meshes, dados serializáveis e uma camada explícita que converta teclado/toque em ações do jogador.

**E. `three-webgl-game` — `openai/plugins`, pacote Game Studio**

Origem: `plugins/game-studio/skills/three-webgl-game/SKILL.md` [S6].

Use como referência principal para implementar o FPS em Three.js sem React. Aplique ao ciclo de vida do renderer, câmera em primeira pessoa, carregamento, descarte de recursos e diagnóstico de problemas gráficos. Siga as APIs compatíveis com a versão efetivamente instalada.

Adaptação deliberada do projeto: não adicione Rapier, SpectorJS ao bundle final, carregadores de modelos/compressão ou pós-processamento apenas porque aparecem na stack sugerida pela skill. O MVP usa cenário simples, colisões testáveis e texturas autorizadas. Uma dependência extra exige necessidade demonstrada e decisão registrada; uma mudança de escopo exige aprovação.

Não invente modelos GLB inexistentes nem transforme a capa inteira em um personagem supostamente animado. O formato GLB é relevante quando houver modelos reais, não uma obrigação para criar paredes simples.

**F. `game-ui-frontend` — `openai/plugins`, pacote Game Studio**

Origem: `plugins/game-studio/skills/game-ui-frontend/SKILL.md` [S7].

Use para HUD, pausa, instruções, derrota e recompensa. Mantenha textos e controles em DOM/CSS, com a mesma identidade do site. Reserve o centro da tela para explorar e mirar; deixe detalhes secundários na pausa. Os controles de toque precisam ser utilizáveis sem cobrir o objetivo.

Entrega esperada: estados de interface claros, ações consistentes e limites entre movimento da câmera e interação com menus. A capa interativa da home continua sendo CSS, não uma cena Three.js.

**G. `game-playtest` — `openai/plugins`, pacote Game Studio**

Origem: `plugins/game-studio/skills/game-playtest/SKILL.md` [S8].

Use em cada incremento jogável. Execute o percurso de entrada, movimento, interação, confronto/evitação, coleta, saída e recompensa. Inspecione screenshots do mundo e do HUD, além de logs e estados. Verifique pausa, perda de pointer lock, reinício, mudança de aba e reentrada no jogo.

Um teste que altera o localStorage ou injeta a vitória verifica apenas uma parte da interface, não a jogabilidade. Separe esse teste do percurso real. Quando automação de câmera ou WebGL não funcionar no ambiente, documente um playtest manual pendente, sem inventar aprovação.

**H. `web-perf` — `cloudflare/skills`**

Origem: `skills/web-perf/SKILL.md` [S9].

Use para investigar carregamento da home e transição para o jogo. Priorize medições do peso da capa, fontes, módulos, requisições e mudanças de layout. Confirme que o motor e os áudios não são baixados durante a abertura da home.

A skill usa recursos de navegador/performance e prevê verificar sua disponibilidade. Não presuma que Chrome DevTools MCP está conectado. Sem ferramentas de trace, faça as verificações possíveis e identifique métricas não coletadas. Lighthouse local não representa automaticamente experiência real de todos os visitantes; FPS de jogo é medição separada.

Entrega esperada: `docs/performance.md` com condições do teste, evidências, alterações e comparação antes/depois quando disponível. Não invente valores para preencher tabelas.

**I. `cloudflare` — `cloudflare/skills`**

Origem: `skills/cloudflare/SKILL.md` [S10].

Use pontualmente na preparação de hospedagem e arquivos, consultando as referências de Pages, R2 e cache que se aplicam ao projeto. Verifique CORS, Content-Type, Content-Disposition, Cache-Control, limites e exposição dos objetos conforme a documentação atual.

Conflito conhecido: a versão consultada recomenda Workers/Workers Static Assets para sites novos. Este projeto escolheu explicitamente Pages e não pediu Worker. Registre a diferença e preserve a decisão; uma skill de infraestrutura não autoriza migração automática. Se surgir uma incompatibilidade real, apresente o impedimento antes de alterar a arquitetura.

Consultar documentação não exige conceder acesso à conta Cloudflare. Preparar configuração não autoriza deploy, criação de recursos, DNS, upload de masters ou alterações de permissões. MCP de administração e credenciais são opcionais e só entram com autorização específica.

**J. `systematic-debugging` — `obra/superpowers`**

Origem: `skills/systematic-debugging/SKILL.md` [S11].

Use quando houver bug reproduzível, erro de build, falha de teste ou comportamento inesperado. Reproduza, reúna evidências, formule uma hipótese, faça uma correção pequena e verifique o caso original. Evite trocar várias dependências ou redesenhar a arquitetura a cada erro.

Este projeto usa a skill de forma seletiva, não o framework Superpowers inteiro. Quando houver referência a outra skill não instalada, registre isso e aplique a prática equivalente com a suíte existente. Não alegue ter executado uma skill ausente. Nunca copie exemplos de diagnóstico que imprimam segredos ou despejem o ambiente inteiro em logs.

**K. `verification-before-completion` — `obra/superpowers`**

Origem: `skills/verification-before-completion/SKILL.md` [S12].

Use antes de declarar uma entrega concluída. Execute as verificações relevantes depois das últimas mudanças, leia os resultados e compare o que foi entregue com os critérios deste briefing.

Para o psicoZ, o encerramento distingue build, typecheck, testes unitários, testes de fluxo, revisão visual e medição em aparelho. Uma categoria aprovada não prova as demais. Entrega de código não autoriza commit, push, PR ou publicação automática.

#### 0.3. Skill opcional, somente com assets 3D reais

**`web-3d-asset-pipeline` — `openai/plugins`, Game Studio** [S13].

Origem: `plugins/game-studio/skills/web-3d-asset-pipeline/SKILL.md`.

Acione quando existirem modelos GLB/glTF para organizar, exportar, validar ou otimizar. Ela não é pré-requisito para construir a home nem o primeiro cenário com geometria simples. Não instale Blender, compressores ou geradores pagos preventivamente.

#### 0.4. Ordem de ativação

| Etapa | Skills a consultar | Evidência exigida |
|---|---|---|
| Home e identidade | `frontend-design` | Página implementada e screenshots desktop/mobile |
| Usabilidade da home | `web-design-guidelines` + `playwright-cli` | Fluxos de capa, painel, coleção e NFC exercitados |
| Revisão de carregamento | `web-perf` | Rede/bundle analisados; métricas coletadas ou pendências declaradas |
| Arquitetura da primeira fase | `web-game-foundations` | Limites entre estado, entrada e renderer definidos |
| Implementação do FPS | `three-webgl-game` + `game-ui-frontend` | Fase jogável, HUD legível e controles coerentes |
| Validação da fase | `game-playtest` + ferramenta de navegador disponível | Percurso real, screenshots e reprodução dos problemas |
| Preparação Pages/R2 | `cloudflare` | Configuração documentada, sem publicação não autorizada |
| Bug encontrado | `systematic-debugging` | Reprodução, hipótese, correção e teste de regressão |
| Encerramento de qualquer entrega | `verification-before-completion` | Comandos/resultados atuais e pendências reais |

Não carregue todos os arquivos e referências de todas as skills no contexto de uma única tarefa. Leia o necessário à etapa e siga os links relevantes apenas quando precisar deles.

#### 0.5. Preparação do ambiente e integridade das fontes

Antes de instalar qualquer coisa, identifique versão/ambiente do Codex, sistema operacional, Node/npm, skills já disponíveis e instruções `AGENTS.md` existentes. Não duplique skills que já estejam acessíveis nem sobrescreva ajustes locais.

O Codex documenta descoberta local de skills em `.agents/skills/` no repositório e instalação por `$skill-installer` no CLI/IDE [S14]. Prefira escopo do projeto quando possível. Nomes exibidos por um plugin podem incluir namespace: use a identificação realmente disponível, não presuma que apenas escrever `$nome` tornou a skill acessível.

As origens deste catálogo estão verificadas, mas nenhuma skill foi instalada no computador do usuário por este briefing. A preparação precisa registrar o que foi realmente instalado, o que já existia e o que ficou pendente. Se rede ou permissões impedirem a instalação, continue as partes possíveis com a documentação e o briefing, sem atribuir execução a uma skill indisponível.

**Atenção ao pacote Game Studio:** suas skills usam referências compartilhadas em `../../references/`. Não copie somente os arquivos `SKILL.md` ou mova cada pasta isoladamente quebrando os links. Reutilize o plugin disponível, ou mantenha o pacote completo e suas referências na estrutura original [S5–S8, S15]. Instalar/conectar um plugin adicional não é obrigatório para consultar seus arquivos públicos.

Para uma solução estritamente local, uma opção é preservar o pacote revisado sob `.agents/vendor/game-studio/` e criar uma skill adaptadora própria e pequena em `.agents/skills/psicoz-game-workflow/`, que encaminhe explicitamente aos arquivos originais no vendor. Identifique-a como adaptadora criada para o projeto, não como uma skill oficial encontrada no GitHub. Resolva referências relativamente ao arquivo original e valide os caminhos. Não duplique o conteúdo de todas as skills dentro dela.

Para qualquer fonte externa: confirme proprietário/repositório/caminho, examine instruções e scripts relevantes antes da execução, preserve licenças e registre o commit usado. Não siga instaladores apontando para repositórios de terceiros diferentes da origem selecionada sem investigar. Não use um `curl | sh` ou instalação massiva como atalho.

Mantenha `docs/skills-registry.md` com: skill, fornecedor, URL, caminho de origem, commit/ref resolvido, licença consultada, localização efetiva, dependências, adaptação do projeto e estado de disponibilidade. Não invente hashes de commit. Registre as versões realmente resolvidas durante a preparação; não faça atualização automática em cada sessão.

As skills e o vendor ficam fora de `public/` e de `dist/`. Não distribua fontes de tipografia ou assets externos só porque estavam presentes no repositório de uma skill. A autorização de uso de uma imagem, fonte ou áudio é independente do arquivo de instruções.

#### 0.6. Regras de aprovação e relatório

Acionar uma skill não concede permissões adicionais. Não desative sandbox, não leia credenciais pessoais sem necessidade, não exponha `.env`, não envie músicas inéditas a serviços externos e não configure novos MCPs administrativos sem autorização.

No relatório de cada entrega, diga quais skills foram efetivamente lidas/aplicadas, quais sugestões foram deixadas de fora por conflito com o escopo e quais verificações foram executadas. Não exija burocracia a cada alteração pequena: mantenha os registros curtos e úteis.

A primeira execução prepara apenas o conjunto necessário à home. A preparação de skills não deve consumir a entrega inteira nem substituir a implementação da Entrega 1.

### 1. Informações e decisões que devem ser preservadas

- Nome textual do álbum: **psicoZ**, com essa grafia. Preserve o lettering original das imagens sem redesenhá-lo para forçar uma correspondência tipográfica.
- Quantidade atual: **15 músicas**. Esse número substitui o briefing antigo de 13 faixas.
- Lançamento planejado: **31/10/2026**. Centralize essa data; não invente horário de lançamento.
- A contracapa enviada enumera 14 músicas. Reserve a posição 15 como pendente de título, créditos, áudio e arte. Não trate as imagens como a tracklist final de 15 músicas.
- Crie IDs estáveis, de `track-01` a `track-15`. Não deduza títulos ou participações difíceis de ler. Marque transcrições provisórias para revisão.
- Não presuma que existem 15 desenhos isolados ou uma relação faixa–desenho já confirmada. Essa associação deve ser configurável.
- O nome artístico a exibir, a biografia final, o texto conceitual do álbum, links, créditos e arquivos de áudio devem vir de conteúdo aprovado. Não invente carreira, números de público, participações ou links.
- A plataforma não terá cadastro, login, banco de dados, pagamento interno ou proteção antipirataria.
- Quem chega pelo mini CD NFC recebe acesso aos downloads publicados. Quem entra normalmente pode conquistar recompensas jogando.
- Aceito que os links sejam compartilhados e que alguém encontre os arquivos sem jogar. O propósito é descoberta, diversão e circulação da música.

Centralize informações pendentes em configuração e em `docs/content-checklist.md`. Use placeholders honestos em desenvolvimento, sem bloquear o trabalho nem apresentá-los como conteúdo final.

### 2. Referências visuais e uso das imagens

As quatro referências fornecidas são:

- `Teste Export fundo preto 4.png`: capa/colagem sobre fundo preto.
- `Teste Export fundo branco 3.png`: variante clara da capa/colagem.
- `contra capa 1  fundo branco .png`: contracapa clara.
- `contra capa 1  fundo preto .png`: contracapa escura.

Localize os arquivos efetivamente disponíveis. Não suponha que estarão em um caminho específico de outro ambiente.

A direção é preto, vermelho, branco sujo, traço manual, tipografia gótica, colagem, olhos, mãos, correntes, espinhos, figuras encapuzadas e criaturas surreais.

Interprete isso como **horror gráfico underground com ambiente industrial e jogo retrô**, não como cyberpunk genérico azul/roxo com neon em tudo.

Use preto e carvão como base; vermelho para identidade, destaques e ornamentação; branco sujo para textos e controles que precisam de leitura imediata. A atmosfera pode ser escura sem esconder os elementos interativos.

A composição deve ter espaço vazio e hierarquia. Não repita a capa inteira como textura de fundo de todas as seções. Distribua poucos elementos gráficos por área.

Use lettering expressivo no logo e nos destaques; textos corridos, instruções e botões precisam de fonte legível. Não tente reproduzir os ideogramas nem atribuir significados a eles sem confirmação.

Evite cards corporativos repetitivos, cantos excessivamente arredondados, vidro translúcido, gradientes coloridos, ícones de emoji, cursor personalizado obrigatório e animações contínuas disputando atenção.

Preserve os originais em `source-art/`, fora do diretório publicado. Crie derivados otimizados para a interface e mantenha um mapa de origem dos assets. Compare visualmente as versões comprimidas para não destruir o traço fino vermelho.

Não remova fundos, redesenhe personagens ou recorte o lettering de maneira destrutiva. Na ausência de elementos isolados, use a arte em painéis e enquadramentos coerentes. Não finja que uma prancha inteira já é uma coleção de sprites animados.

### 3. Home completa, acessível sem entrar no jogo

Tudo que apresenta o lançamento deve estar na home, organizado em seções. “Tudo na home” não significa apertar todas as informações na primeira tela.

Não use uma tela obrigatória de “entrar no site”, loading cinematográfico ou canvas de jogo como barreira para acessar informações.

#### A. Navegação e abertura

Crie navegação compacta para Álbum, Artista, Faixas, Jogo e Coleção.

A primeira tela deve apresentar psicoZ, a data/estado do lançamento, uma chamada curta e a capa isolada em destaque. Em desktop, combine texto e capa em duas áreas; no celular, empilhe preservando o protagonismo da arte.

Antes do lançamento, destaque “Fazer pré-save”. Depois, “Ouvir o álbum”. Mantenha “Jogar e conquistar faixas” como ação distinta e deixe claro quando a demonstração ou o jogo ainda não estiver disponível.

#### B. Capa interativa

Exiba a imagem completa, quadrada, sem cortes, distorção ou sobreposição que esconda o desenho. Ela deve parecer uma peça física destacada da página, não um fundo atrás de texto.

A interação usa CSS: leve elevação, sombra, escala discreta e, opcionalmente, inclinação pequena acompanhando o mouse. Não carregue Three.js para animar a capa.

Diferencie a borda da capa preta do fundo com carvão, contorno ou iluminação sutil. A sombra deve ser perceptível sem virar um grande brilho vermelho.

Clicar ou tocar abre um painel acessível com os links aprovados de pré-save; após o lançamento, com os links de escuta. Mostre indicação de que a capa é clicável e forneça também um botão textual equivalente.

Implemente foco visível, ativação por teclado, fechamento por Escape, gerenciamento de foco no painel e retorno ao elemento que o abriu. No toque, não exija hover. Respeite movimento reduzido e não deixe a animação permanente.

#### C. Sobre o álbum e sobre o artista

Crie duas seções distintas: conceito do álbum e apresentação do artista. Ambas ficam na home, não escondidas no modal do pré-save.

Use os textos aprovados quando existirem. Enquanto faltarem, mantenha conteúdo claramente provisório em desenvolvimento. Não publique lorem ipsum nem transforme interpretações dos desenhos em declarações oficiais do artista.

A área do artista deve aceitar nome, biografia curta, foto opcional, redes e contato aprovado. A ausência de foto não pode quebrar o layout.

#### D. Tracklist

Mostre 15 posições em HTML legível, responsivo e selecionável. A imagem da contracapa pode complementar a seção, mas não substitui a lista textual.

Cada faixa aceita título, créditos, arte, duração conhecida, disponibilidade de áudio, fase associada e recompensa. Não invente duração.

Diferencie “em breve”, “jogue para conquistar” e “download liberado”. Disponibilidade editorial, progresso do jogador e estado da implementação não são a mesma coisa.

A faixa 15 aparece como “A anunciar” enquanto seu título estiver pendente. Não a chame de bônus sem confirmação.

#### E. Entrada do jogo, coleção e NFC

Apresente o jogo com um visual derivado das artes, uma explicação curta, controles e estado de disponibilidade. Não carregue o motor 3D antes da decisão de jogar.

A coleção na própria home reúne músicas e materiais conquistados ou liberados por NFC. Deve ser possível acessá-la sem abrir o jogo.

Explique o mini CD NFC em linguagem simples: aproximar de um celular compatível abre um endereço da plataforma. A explicação não deve conter um botão que finge ler a tag ou comprovar a compra.

Finalize com créditos reais, links válidos e informação breve sobre progresso salvo no aparelho.

### 4. Pré-save e fases do lançamento

Mantenha `releaseStatus: 'pre-release' | 'released'` na configuração. A mudança oficial será controlada por configuração e publicação, não por confiar no relógio do visitante.

Pré-save significa abrir os links externos aprovados. Não implemente OAuth, API de streaming, coleta de senhas ou formulário de cadastro local.

A plataforma continua sem conta própria; um serviço externo pode ter suas próprias exigências. Não prometa que o pré-save externo dispensa autenticação.

Não confunda link de perfil do artista com pré-save do álbum. Não mostre “pré-save concluído” apenas porque alguém clicou. Links não fornecidos devem ficar desabilitados com explicação, sem `href="#"` falso.

Separe o ambiente de demonstração do conteúdo final. Antes da autorização de publicação, não inclua masters inéditas, ZIPs ou URLs secretas no build público ou bucket público.

Desbloquear uma recompensa não torna disponível um arquivo ainda não publicado. A interface deve preservar a conquista e indicar que o material será disponibilizado depois.

### 5. Downloads, NFC e progresso local

Use uma URL comum na tag, por exemplo `/?edition=nfc#colecao`.

Ao abrir essa URL, reconheça o parâmetro, salve a liberação da edição física e apresente a coleção. Esse endereço é compartilhável: não é autenticação nem prova de compra.

Não use Web NFC, UID de tag, tokens únicos ou validação remota.

Mantenha estado local versionado, com identificador do álbum, liberação NFC, faixas conquistadas, fases concluídas, colecionáveis e preferências.

Separe claramente:

- Material publicado e com arquivo disponível.
- Acesso adquirido por NFC ou pela conclusão do objetivo.
- Conquista de gameplay, que só existe quando a fase foi efetivamente concluída.

A edição NFC libera o acesso, mas não marca artificialmente 15 fases como vencidas. Use uma função central para decidir se um download pode aparecer como disponível.

Persista com `localStorage`, valide os dados e trate JSON inválido, versão antiga e falha de gravação. Use memória como fallback e avise quando o progresso não puder ser salvo.

Não salve músicas ou imagens nesse armazenamento. Se já houver progresso do protótipo antigo, migre IDs compatíveis sem apagar conquistas à toa.

Explique que não há sincronização entre aparelhos e que limpar os dados do navegador pode apagar o progresso. A URL da tag pode restaurar o acesso NFC.

Ofereça reset com confirmação, limitado às chaves deste projeto.

Disponibilize MP3, PNG e ZIP somente quando existirem; formatos adicionais ficam configuráveis. Mostre tamanho quando conhecido, sem iniciar downloads automáticos. Não afirme que o arquivo foi salvo só porque houve clique.

### 6. Jogo: entrar no universo visual do álbum

Crie um FPS retrô inspirado na linguagem de Doom, com geometria 3D simples, aparência 2.5D, texturas de baixa resolução e elementos gráficos autorais. Não copie níveis, sprites, armas ou áudio de Doom.

A proposta é atravessar uma arquitetura construída com referências da capa. Não basta colocar uma imagem do álbum na parede de um cenário genérico.

Direções possíveis, ainda não associações oficiais entre músicas e desenhos:

- Olhos podem orientar a vigilância e a leitura do cenário.
- Mãos e símbolos podem virar objetos de interação e colecionáveis.
- Correntes e grades podem estruturar portas e caminhos.
- A balança pode inspirar uma escolha simples entre passagens.
- Figuras e criaturas podem aparecer em murais, silhuetas e inimigos, conforme os assets permitirem.

Escolha poucos desses motivos por fase. Evite gore gratuito, sustos excessivos e flashes fortes. A identidade vem da composição, não de poluição visual.

Construa um único motor reutilizável. As 15 faixas devem ser associáveis a fases por dados, sem criar 15 jogos independentes nem copiar o código inteiro.

### 7. Primeira fase completa antes de multiplicar conteúdo

Na segunda entrega, implemente uma fase demonstrativa de aproximadamente 2 a 4 minutos.

Fluxo proposto: entrar em um corredor industrial → explorar uma pequena área com dois caminhos → encontrar três símbolos → enfrentar ou evitar um inimigo → ativar a saída → receber um mini CD virtual e a recompensa.

Esse percurso é uma hipótese de demonstração, não narrativa oficial nem nome definitivo de faixa.

Use uma arma simples, um tipo de inimigo, uma interação e poucas regras. O objetivo precisa ficar evidente em poucos segundos.

Implemente movimento, câmera, colisões, dano, pausa, derrota, reinício e vitória reais. Paredes devem bloquear passagem, tiros e ataques. A movimentação não pode depender da taxa de quadros.

Mantenha um único loop de atualização por sessão; trate retornos de aba e deltas grandes sem teletransportar o jogador.

Não substitua gameplay por botões de “vencer”, cartões de missões ou um corredor onde nada pode acontecer. Atalhos de testes não entram na versão pública.

Ao vencer, mostre a arte da recompensa, a faixa associada e ações para baixar o que estiver publicado, visitar a coleção ou jogar novamente. Preserve o resultado após recarregar.

Uma descoberta opcional e um recorde pessoal local podem entrar depois, sem ranking online nem pressão para completar tudo em sequência.

Cada fase futura pode variar percurso, objetivo, composição e ritmo. Não entregue 15 cópias com cores diferentes.

### 8. Música, controles e acessibilidade

Toque a faixa associada como trilha após uma ação explícita. Não inicie áudio automaticamente na home.

Use `HTMLAudioElement` para reprodução; Web Audio API apenas quando necessário para efeitos ou reatividade discreta. Não dependa de sincronização perfeita com batidas no MVP.

Sem áudio fornecido, use somente um arquivo demonstrativo original, identificado como teste. Nunca apresente áudio gerado ou genérico como uma música do artista.

Carregue apenas a música necessária. Evite reprodução simultânea do player e do jogo. Separe volumes de música e efeitos; trate falha de reprodução e contexto de áudio suspenso.

Pause jogo e áudio ao perder visibilidade. Mantenha opção de jogar sem som, com objetivos e feedback visuais.

No desktop, use WASD, mouse, disparo, interação e Escape. Pointer lock deve começar após ação explícita; sua perda pausa a partida e oferece retomada.

No celular, use movimento à esquerda, área para câmera à direita e botões separados de ação. Trate multitouch, áreas seguras e conflitos de gesto. Evite rolagem da página somente enquanto os controles do jogo estiverem ativos.

A home, o pré-save, o NFC e a coleção devem funcionar em retrato. Pode recomendar paisagem para o jogo, sem depender de fullscreen ou bloqueio obrigatório de orientação.

Ofereça controles de sensibilidade e redução de movimento. A interface deve permanecer nítida mesmo quando o mundo do jogo estiver pixelado.

Quando WebGL ou os recursos necessários falharem, mostre uma mensagem útil e mantenha o restante da plataforma acessível. Nunca deixe apenas um canvas preto.

### 9. Stack e arquitetura

Use HTML semântico, CSS e TypeScript com Vite. Use Three.js para o jogo, Vitest para lógica e Playwright para fluxos e revisão visual quando o ambiente permitir.

Priorize APIs nativas e dependências pequenas. Não introduza React, Next.js, Phaser, Unity, banco de dados, autenticação, servidor Node em produção, Cloudflare Workers ou Pages Functions para este escopo.

Node e npm são ferramentas de desenvolvimento/build. O resultado publicado deve ser estático, em `dist/`.

Use versões estáveis compatíveis, registre a versão de Node e mantenha o lockfile. Não atualize dependências existentes sem necessidade.

Sugestão de organização; adapte sem criar abstrações vazias:

.agents/skills/            # skills locais/referências adaptadoras selecionadas, fora do build
.agents/vendor/            # pacotes revisados que exigem estrutura compartilhada, se necessário
source-art/                # originais, fora do build público
public/assets/            # derivados aprovados e demos pequenas
src/
  main.ts
  app/                    # navegação e ciclo de vida
  config/                 # artista, álbum, links e publicação
  data/                   # 15 faixas, artes, recompensas e fases
  ui/                     # seções da home, capa, painel e coleção
  state/                  # persistência, migrações e acesso
  game/                   # renderer, input, mundo, entidades e objetivos
  audio/                  # reprodução e efeitos
  styles/                 # tokens, layout, componentes e responsividade
tests/
scripts/                  # validação de conteúdo/build
docs/
AGENTS.md
README.md
.env.example

Separe navegação e DOM do motor. Preserve a home sem dependência do módulo de jogo. Faça importação dinâmica de Three.js e das fases somente ao jogar.

Use âncoras reais nas seções da home. Para a tela do jogo, uma rota hash reservada, como `#/jogar/track-01`, é suficiente. Não confunda rotas do jogo com âncoras como `#colecao`; trate voltar, recarregar, sair e restaurar o scroll.

Mantenha modelos tipados para artista, álbum, faixa, arte, fase, recompensa e progresso. Nenhum limite de 13 ou 14 faixas deve ficar escondido na lógica.

Inclua título da página, descrição e imagem social coerentes com o lançamento. Metadados essenciais devem estar no HTML publicado, não apenas ser modificados após carregar JavaScript.

### 10. Cloudflare, assets e downloads

Prepare o build para Cloudflare Pages. Use R2 para músicas, imagens de alta resolução e pacotes maiores, com domínio próprio em produção.

Configure `VITE_ASSET_BASE_URL` para alternar entre assets locais e remotos. Nenhuma credencial entra no frontend ou em variável pública `VITE_`.

Não dependa de uma conta Cloudflare para rodar a demonstração local. Não publique arquivos acima do limite individual do Pages; documente a separação para R2.

Documente CORS nas origens necessárias, tipos MIME, `Cache-Control` e nomes versionados de assets. Não suponha que todo objeto do R2 estará automaticamente em cache.

Diferencie URLs de reprodução e de download quando precisarem de cabeçalhos diferentes. Para downloads entre domínios, não confie apenas no atributo HTML `download`; configure `Content-Disposition: attachment` nos objetos destinados a baixar.

Não carregue álbuns inteiros em Blob na memória do celular. Prepare ZIPs antes da publicação, não no navegador de cada visitante.

Trate carregamento, arquivo ausente e tentativa novamente. Um PNG opcional que falhou não deve derrubar o jogo.

Não execute deploy, altere DNS ou exponha arquivos ainda inéditos sem autorização.

### 11. Desempenho e escala

A home não deve baixar as 15 músicas, todas as fases ou o motor 3D. Priorize a capa de abertura e carregue imagens secundárias sob demanda.

No jogo, limite resolução interna, efeitos e complexidade da cena. Use perfis de qualidade simples e evite sombras caras e pós-processamento excessivo.

Ao sair, libere recursos gráficos, listeners e áudio. Voltar a jogar não pode criar loops duplicados ou vazamentos crescentes.

Metas iniciais a medir, não promessas: home abaixo de 1,5 MiB transferido sem áudio/jogo; primeira fase abaixo de 8 MiB sem música; 60 FPS em desktop de referência e 30 FPS em celular de referência. Registre medições e justifique desvios.

Diferencie testes em viewport mobile de testes em aparelho real.

Documente os fatores para 1.000, 1.500 e 10.000 visitantes: tamanho médio transferido, acessos simultâneos, cache, operações R2 e capacidade do aparelho. Não confunda número de visitantes com número de páginas ou prometa custo zero e desempenho garantido sem evidência.

### 12. Testes e critérios de aceite

Forneça comandos reproduzíveis para desenvolvimento, build, preview, typecheck, testes unitários e testes de fluxo. Use `npm ci` com lockfile para reproduzir o ambiente.

Para a primeira entrega, verifique:

- Home com todas as seções, sem exigir jogo ou login.
- Capa original completa, interação por mouse, teclado e toque.
- Painel de pré-save acessível, links reais ou pendências claramente indicadas.
- Catálogo de 15 posições e posição 15 pendente, sem títulos ou créditos inventados.
- Distinção entre pré-lançamento, arquivo publicado e acesso conquistado.
- URL NFC, persistência após reload, armazenamento corrompido e fallback em memória.
- Ausência de download do motor 3D e de áudios na abertura.
- Layout sem cortes ou sobreposições em desktop e celular.

Na segunda entrega, acrescente teste da fase real, colisões, condição de vitória, recompensa persistente, áudio, pausa e reentrada na partida. Um teste que injeta progresso não comprova que o jogo é jogável.

Capture screenshots da home, painel e coleção; depois, da fase e recompensa. Inspecione a composição e corrija problemas visuais, não apenas erros de compilação.

Registre comandos executados, resultados e testes pendentes. Não diga que mediu desempenho de aparelho que não usou ou que um teste passou quando não foi executado.

### 13. Ordem de execução e escopo imediato

**Entrega 1 — Home e base funcional.**

Implemente a direção visual usando as artes reais, as seções completas, capa interativa, pré-save configurável, 15 posições, coleção, entrada NFC, persistência, estados de publicação, testes e documentação. O jogo aparece honestamente como “em desenvolvimento”, sem gameplay falso.

**Entrega 2 — Uma fase completa.**

Após a revisão da home, implemente o percurso jogável descrito, controles de desktop e toque, áudio demonstrativo, recompensa e integração com a coleção. Aproveite a arquitetura e a identidade aprovadas.

**Entrega 3 — Conteúdo e expansão.**

Integre músicas, créditos, artes e mapeamentos aprovados. Expanda as fases com a base validada. Revise a contracapa diante das 15 faixas. Não marque fases ausentes como concluídas.

**Entrega 4 — Publicação.**

Prepare Pages/R2, valide links e arquivos, confira embargo e estado de lançamento, revise aparelhos reais e documente o procedimento de publicação.

**Execute agora somente a Entrega 1, até estar funcional e verificável, preparando e acionando as skills pertinentes conforme a seção 0.** Não espalhe o esforço construindo 15 fases rasas antes de acertar a plataforma e sua identidade.

Guarde o briefing em documentação do projeto. Crie ou atualize um `AGENTS.md` curto com stack, comandos, convenções e restrições; mantenha o andamento em `docs/roadmap.md`.

Ao finalizar, informe o que funciona, como rodar, arquivos centrais, testes executados e pendências de conteúdo. Diferencie base visual pronta, jogo implementado e lançamento pronto para publicar.

## FIM DO PROMPT MESTRE

---

## Comando para a segunda entrega, após revisar a home

Continue o projeto psicoZ a partir deste briefing e da home existente. Prepare as skills do Game Studio com suas referências preservadas. Consulte web-game-foundations para os limites de arquitetura; use three-webgl-game e game-ui-frontend para implementar e game-playtest para validar. Não reabra a escolha da stack nem acrescente física pesada por padrão. Execute a Entrega 2: uma fase em primeira pessoa realmente jogável, com referências visuais da capa, colisões, inimigo simples, três símbolos, saída, áudio de demonstração, controles de desktop e toque, pausa, reinício e recompensa persistente integrada à coleção. Preserve a home e sua direção visual. Não implemente as outras 14 fases agora. Não publique masters inéditas. Teste o percurso real e relate o que foi verificado e o que continua pendente.

## Referências técnicas para implementação

As decisões de produto e os conceitos de fase acima são propostas para este projeto; não são fatos sobre a narrativa do álbum. As referências abaixo sustentam aspectos técnicos, não garantias de estética, custo ou desempenho.

- Vite — saída estática, build e deploy: https://vite.dev/guide/static-deploy.html
- Three.js — controles de primeira pessoa: https://threejs.org/docs/pages/PointerLockControls.html
- Cloudflare Pages — limites e arquivos maiores no R2: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare R2 — domínio público de produção e limites de r2.dev: https://developers.cloudflare.com/r2/buckets/public-buckets/
- Cloudflare R2 — CORS: https://developers.cloudflare.com/r2/buckets/cors/
- MDN — comportamento de links e do atributo download: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a
- OpenAI — contexto, critérios de conclusão e validação no Codex: https://developers.openai.com/codex/learn/best-practices/
- OpenAI — instruções persistentes com AGENTS.md: https://developers.openai.com/codex/guides/agents-md/


## Fontes das skills e observações da pesquisa

Fontes primárias consultadas em 17/09/2026. Os caminhos abaixo identificam arquivos existentes na consulta, não uma versão imutável já instalada. Registre o commit na instalação. As aplicações específicas ao psicoZ nesta versão são instruções autorais de projeto, não promessas dos mantenedores.

- **[S1] Anthropic — frontend-design:** https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md
- **[S2] Vercel Labs — web-design-guidelines:** https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/web-design-guidelines/SKILL.md
- **[S3] Vercel Labs — diretrizes usadas pela skill:** https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
- **[S4] Microsoft — playwright-cli:** https://raw.githubusercontent.com/microsoft/playwright-cli/main/skills/playwright-cli/SKILL.md
- **[S5] OpenAI — web-game-foundations:** https://raw.githubusercontent.com/openai/plugins/main/plugins/game-studio/skills/web-game-foundations/SKILL.md
- **[S6] OpenAI — three-webgl-game:** https://raw.githubusercontent.com/openai/plugins/main/plugins/game-studio/skills/three-webgl-game/SKILL.md
- **[S7] OpenAI — game-ui-frontend:** https://raw.githubusercontent.com/openai/plugins/main/plugins/game-studio/skills/game-ui-frontend/SKILL.md
- **[S8] OpenAI — game-playtest:** https://raw.githubusercontent.com/openai/plugins/main/plugins/game-studio/skills/game-playtest/SKILL.md
- **[S9] Cloudflare — web-perf:** https://raw.githubusercontent.com/cloudflare/skills/main/skills/web-perf/SKILL.md
- **[S10] Cloudflare — seleção de produtos/referências:** https://raw.githubusercontent.com/cloudflare/skills/main/skills/cloudflare/SKILL.md
- **[S11] Obra/Superpowers — systematic-debugging:** https://raw.githubusercontent.com/obra/superpowers/main/skills/systematic-debugging/SKILL.md
- **[S12] Obra/Superpowers — verification-before-completion:** https://raw.githubusercontent.com/obra/superpowers/main/skills/verification-before-completion/SKILL.md
- **[S13] OpenAI — web-3d-asset-pipeline, opcional:** https://raw.githubusercontent.com/openai/plugins/main/plugins/game-studio/skills/web-3d-asset-pipeline/SKILL.md
- **[S14] OpenAI — descoberta, instalação e uso de skills no Codex:** https://developers.openai.com/codex/skills/ (na consulta, redireciona à documentação oficial em https://learn.chatgpt.com/docs/build-skills)
- **[S15] OpenAI — manifesto do pacote Game Studio:** https://raw.githubusercontent.com/openai/plugins/main/plugins/game-studio/.codex-plugin/plugin.json
- **[S16] OpenAI — aviso de descontinuação do catálogo antigo:** https://github.com/openai/skills
- **[S17] Cloudflare — instalação e escopo do pacote:** https://raw.githubusercontent.com/cloudflare/skills/main/README.md

### O que foi deliberadamente deixado de fora

Não trate `openai/skills` como o catálogo principal atual: seu README o marca como deprecated e encaminha para `openai/plugins` [S16]. Para jogos, esta seleção usa arquivos verificados do Game Studio, sem depender de um caminho antigo de `develop-web-game`.

O pacote Game Studio tem uma entrada genérica `game-studio` que favorece 2D quando o projeto não escolheu uma direção. Como o psicoZ já definiu Three.js/TypeScript/Vite, use diretamente as skills especialistas acima. Não instale a variante Phaser ou React Three Fiber para este projeto.

Não foi adotada a coleção inteira `obra/superpowers`: selecionamos somente diagnóstico e verificação. Também não são necessários skills de Stripe, Supabase, autenticação, Next.js, MCP de nuvem administrativo ou geração automática de imagens para a Entrega 1.

### Comando inicial para colar no Codex

```text
Leia psicoZ_prompt_codex_v3_skills.md como briefing mestre do projeto.
Preserve o código, AGENTS.md e as configurações que já existirem.

Prepare as skills indicadas na seção 0 apenas para a Entrega 1:
frontend-design, web-design-guidelines e playwright-cli;
web-perf na revisão; systematic-debugging quando houver bug;
verification-before-completion no encerramento.

Confira o que já está instalado. Quando faltar uma skill, use as fontes
exatas do briefing, preserve os arquivos necessários, revise o conteúdo
e registre a origem e o commit em docs/skills-registry.md.
Prefira escopo local e não altere configurações globais ou MCPs sem permissão.
Não declare uma skill instalada ou aplicada quando estiver indisponível.

Implemente a home completa usando as artes reais: apresentação do álbum
e do artista, capa isolada com hover/sombra, painel de pré-save,
15 posições na tracklist, coleção, entrada por URL NFC e progresso local.
Mantenha conteúdo não fornecido como pendência honesta.

Não implemente o jogo ainda, não mude a stack, não publique masters
nem execute deploy. Termine a Entrega 1 com build, typecheck, testes
pertinentes e revisão visual. Relate os resultados reais e as limitações.
```

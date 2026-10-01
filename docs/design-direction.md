# Direção visual — Entrega 1

A capa original é a peça central, inteira e isolada. O site funciona como um encarte: abertura em duas áreas, páginas de apresentação, lista de faixas e uma seção de coleção. No celular, texto e capa se empilham. Não há jogo, animação contínua nem arte inventada.

Tokens: preto `#080808`, carvão `#161616`, papel `#eeeae2`, cinza `#b3aea7`, vermelho `#cf202c`, borda `#353333`. O vermelho nas letras desenhadas pertence à arte original; não será recolorido. Branco sujo garante leitura; vermelho vivo fica restrito a ações e destaques.

Tipografia: UnifrakturCook para o nome textual psicoZ e títulos expressivos; Arial/sans-serif para parágrafos e controles. O lettering da capa é preservado, sem recorte ou redesenho. A fonte web será local com licença OFL preservada.

Composição: texto à esquerda e capa à direita na abertura; sobre o álbum e artista em seções distintas; faixas em linhas compactas e selecionáveis; coleção em lista funcional. Há espaço vazio para a complexidade das ilustrações respirar. Não repetimos a capa como fundo.

Revisão do plano: paleta escura e vermelho são requisitos do álbum, não escolha genérica da skill. Evitamos cartões SaaS, neon, contadores inventados e biografia improvisada. O conteúdo pendente aparece explicitamente como a confirmar. O efeito físico da capa é só CSS e responde ao usuário.

Aplicação de frontend-design: plano com tokens, hierarquia, identidade específica do material e crítica por screenshots desktop/mobile. Evidências finais em docs/verification.md.

## Mistura de referências — 21/09/2026

Pedido do usuário: aproximar a home do catálogo de artista da Epidemic Sound mostrado na captura e do [Spectrogram do Chrome Music Lab](https://musiclab.chromeexperiments.com/Spectrogram/). As capturas são referências de composição, sem reutilização de marcas, música, código ou arte de terceiros. A página pública foi aberta para consulta; seu experimento registrou erros no navegador de inspeção, portanto a captura fornecida também orienta a leitura visual.

Plano: navegação em cápsula, abertura em painel carvão com capa quadrada intacta, chips de formato e tracklist com linhas compactas. Acrescentar uma área visual silenciosa em SVG com camadas em perspectiva, modos relevo/linhas e paleta alternativa. A visualização é uma composição abstrata, sem dados de áudio, escalas Hz/dB, playback fictício ou microfone. Nas faixas ainda sem áudio, o grafismo uniforme é um placeholder, não uma forma de onda inventada.

Base `#101012`, painel `#1c1b1f`, papel `#f1eee8`, cinza `#b7b4b8`, vermelho `#cf202c`, borda `#363339`. Lettering gótico permanece em psicoZ e seções editoriais; títulos de catálogo passam a sans-serif. Arredondamentos concentram-se na navegação e nos controles, conforme a nova preferência; a arte original continua inteira e retangular.

Revisão do plano: evitar copiar o produto de referência inteiro ou transformar a home em player sem músicas. Não acrescentar gênero, BPM, duração, foto ou nome artístico sem aprovação. Animação contínua não é necessária: os controles atualizam a arte sob demanda. Preservar NFC, coleção, acessibilidade, pendências e escopo da Entrega 1.

## Tracklist e jogos em uma seção — 30/09/2026

Pedido: unir a chamada dos jogos à tracklist e dar uma miniatura a cada faixa/jogo. A seção única vem logo depois da abertura do álbum. Os links antigos #faixas e #jogo apontam para esse mesmo conjunto, conservando todas as rotas individuais.

Plano de composição: três capas por linha no desktop, duas no tablet e uma lista com miniatura lateral no celular. Cada capa combina um detalhe da arte real do álbum e uma captura do próprio minigame; a numeração segue a sequência real de faixas. Não existe arte nova por faixa aprovada, portanto os recortes são identificadores visuais da interface, sem substituir a capa oficial. O número, o nome da música, a mecânica, o objetivo e Jogar aparecem juntos; Áudio em breve continua explícito.

Tokens: tinta #090909, superfície #110e0f, papel #f2ece2, vermelho vivo #ff203c, texto secundário #bdb1b4, divisória #493035. UnifrakturCook permanece nos títulos e na assinatura; Arial apresenta ações e instruções. Deslocamentos sólidos e hachuras dão profundidade ao recorte, sem iluminação neon. O vermelho do arquivo original não foi editado.

Revisão da proposta: usar capturas reais ajuda a distinguir as 15 mecânicas; um recorte diferente da arte do álbum mantém a ligação com a música. Há uma única lista, sem repetir o catálogo numa seção de jogos separada. Nada roda nas miniaturas: são JPEGs locais de carregamento preguiçoso, com proporção reservada, fallback textual e nomes dos jogos disponíveis ao leitor de tela. As origens das capturas estão em game-thumbnails.json.

### Refinamento em formato de playlist — 30/09/2026

Nova orientação do usuário: linhas como uma playlist, miniatura menor e efeito glass na miniatura, mantendo a identidade psicoZ. Esta orientação substitui a grade de capas do refinamento anterior. A sequência é número, thumb, faixa, minigame/objetivo e Jogar; no celular, a mecânica fica abaixo do nome e o objetivo completo permanece no menu antes de iniciar.

Miniaturas de 64px no desktop, 52px no celular e 46px em telas estreitas. O vidro usa borda translúcida, reflexo estático e blur de2px apenas atrás da imagem de cada thumb. A captura real fica nítida por cima; não há animação permanente ou filtros sobre a página inteira. As linhas conservam fundo de tinta, vermelho vivo, divisórias discretas e foco visível. Os títulos da playlist usam sans-serif para leitura rápida; a assinatura e o cabeçalho continuam góticos. Sem duração de áudio inventada ou controle de reprodução para música ainda não publicada.

Refinamento tipográfico solicitado em seguida: os nomes das músicas na playlist passam para UnifrakturCook 700, a mesma fonte gótica das áreas artísticas, com 22,4 px no desktop, 20 px no celular e 18,4 px nas telas de até 380 px. A estrutura em linhas e os textos auxiliares permanecem legíveis em sans-serif. Essa decisão substitui a escolha anterior de sans-serif para os títulos da playlist.

### Preto e prata, com menos superfícies — 30/09/2026

O usuário pediu uma direção mais minimalista, com a referência de Chrome Hearts, e menos caixas genéricas. A referência foi traduzida em contraste preto/prata, letra gótica, bordas finas e espaço vazio; a identidade e as artes continuam sendo de psicoZ.

Tokens atuais: tinta #090909, superfície #121212, prata #e8e6e2, secundário #a6a4a2, divisória #303030 e vermelho #f02138. O vermelho permanece nas artes originais e nos estados de interação. Tipografia gótica nos títulos e músicas, sans-serif nas instruções pequenas.

Foram retirados a navegação em cápsula, os chips preenchidos, os fundos rosados, as sombras empilhadas e os círculos vermelhos repetidos da playlist. As thumbs mantêm só uma borda prata e reflexão superior discreta; não há diagonal brilhante ou bevel. O cabeçalho e o progresso ficaram compactos, com aviso global de áudio pendente. A coleção usa texto e divisórias, e o NFC compartilha a superfície da página. Os originais não foram alterados; não foram inseridos logos de terceiros ou novas imagens.

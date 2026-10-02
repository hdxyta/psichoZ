# Silêncio brawler

Jogo local para `track-03`, criado para o psicoZ após a troca de Flappy por uma arena de plataforma/luta.

- Personagens desenhados no Canvas a partir de motivos da capa: asa/anjo, freira armada e olho febril.
- Inspiração de gênero: arena fighter/plataforma com leitura de Street Fighter + Brawlhalla, sem código ou assets externos incorporados.
- Vitória real: derrubar três oponentes em rounds sucessivos.
- Controles: teclado, mouse/toque para virar e botões touch.
- Progresso reportado somente pela ponte `PsicoZ.report`.

## Sapo Chifrudo

Primeiro lutador com sprites fornecidos pelo usuário. Os seis PNGs originais ficam em `source-art/`; `node scripts/prepare-silencio-frog.mjs` gera os WebPs de execução. `frog.js` define recortes e pontos de apoio por quadro, com máscaras para evitar poses vizinhas nas folhas de golpes, que não têm espaçamento uniforme. Caminhada/salto originalmente olham à esquerda; ataques/defesa olham à direita e são espelhados conforme a direção atual.

Andar acompanha a distância real percorrida; parado mantém uma pose. J alterna dois golpes de 0,56 s, K inicia o especial de 0,9 s com recarga de 1,4 s. O dano só ocorre na janela de impacto e uma vez por golpe. Espaço usa a física de pulo duplo existente, com poses de impulso, subida, ápice, queda e aterrissagem. Segurar L ou Defesa no chão reduz em 75% o dano frontal e impede atacar ou pular enquanto a guarda está ativa. Movimento durante golpes/guarda é mais lento. Teclas antes de escolher um personagem não iniciam ações; blur/pausa liberam controles mantidos.

Botões móveis: esquerda, direita, Pulo, Ataque, Especial e Defesa. Os desenhos anteriores dos outros personagens permanecem disponíveis. Testes de navegador cobrem estados, orientação, controles, fallback e revisão visual dos recortes em desktop e celular emulado; não substituem teste em aparelho físico.

## Escorpião Monstruoso

Segundo lutador com sprites do usuário, selecionável junto ao sapo. Tem 135 de vida, velocidade 215, força 22 e alcance 80: mais resistente e um pouco mais lento. Os seis originais ficam em `source-art/`; `node scripts/prepare-silencio-scorpion.mjs` gera os WebPs. `scorpion.js` mantém recortes e âncoras individuais, pois os golpes de cauda ocupam larguras diferentes. Todas as folhas olham à direita e são espelhadas conforme o movimento.

Usa os mesmos controles e estados do sapo, com caminhada pela distância percorrida, dois ataques alternados, defesa mantida e salto ligado à física. O especial aplica dano entre 0,50 e 0,74 s, acompanhando a batida da cauda, uma única vez por execução. As máscaras dos quadros de maior alcance excluem as poses vizinhas. Se um WebP estiver indisponível, o desenho simplificado preserva a partida e os controles. A seleção se adapta a duas colunas no celular.

## Freira Armada

A freira substitui o desenho provisório do mesmo personagem por oito folhas do usuário, preservadas em `source-art/`. `node scripts/prepare-silencio-nun.mjs` prepara os WebPs. `nun.js` alinha cada pose pelos pés, espelha a direção e isola os fragmentos das poses vizinhas uma vez por quadro em cache. Caminhada segue a distância real; salto segue impulso, subida, ápice e aterrissagem; defesa acompanha L ou o botão mantido. J usa a folha de tiro parado ou andando conforme o movimento. A animação da arma mantém a direção durante a ação.

O tiro parado dispara aos 0,28 s; a rajada iniciada em movimento dispara aos 0,14 e 0,35 s, dividindo o dano. K lança uma granada aos 0,40 s, com recarga de 1,65 s. `nun-combat.js` simula balas com colisão contínua horizontal e granadas com gravidade, rebote nas plataformas, pavio de 1,15 s e explosão de raio 96. Contato com o oponente também detona a granada. Cada projétil causa dano uma vez, respeita defesa frontal e não atinge quem o lançou. Projéteis e efeitos são limpos na troca de round e usam o relógio pausável do jogo.

Balanceamento inicial: 115 de vida, velocidade 225, pulo 660, dano 22 e granada 44. A IA usa os mesmos ataques à distância. Os efeitos de tiro e explosão têm sequências próprias e fallback sem imagens. Testes unitários verificam trajetória, colisão, raio e limpeza; Playwright cobre estados, tiro sem sprites, granada e toque emulado, com screenshots para revisão.

## Anjo Rasgado

O desenho provisório do anjo foi substituído pelas sete folhas enviadas pelo usuário. Originais em `source-art/`; `node scripts/prepare-silencio-wing.mjs` gera os WebPs. `wing.js` usa recortes por pose, âncoras nos pés e máscaras para separar as asas, roupas e efeitos das poses vizinhas. Caminhada acompanha a distância; salto e defesa seguem o estado físico; a direção fica estável durante a conjuração. Os efeitos de magia e fogo são renderizados separadamente, sem duplicar os efeitos já presentes junto à mão nas folhas da personagem.

J conjura uma magia horizontal aos 0,32 s, com dano 18 e recarga de 0,72 s. K invoca fogo aos 0,36 s, com dano 42 e recarga de 1,8 s. A coluna aparece sob um oponente à frente até 300 unidades ou a 155 unidades à frente do anjo, projetada até o chão/plataforma abaixo dos pés do conjurador. Cresce antes do dano, atinge cada alvo uma vez e se dissipa em 1,05 s. A colisão cresce junto à chama e encerra antes do fade final.

`wing-combat.js` mantém a simulação independente das imagens: magia colide com lutadores/plataformas, efeitos são limpos a cada round, e a pausa congela os mesmos relógios da arena. Mantidos 112 de vida, velocidade 250 e pulo 720. A IA também usa magia e fogo. Testes unitários cobrem colisão, orientação, altura da superfície, dano único e limpeza; os testes de navegador verificam controles, efeitos, imagens ausentes e aparência em desktop/celular emulado.

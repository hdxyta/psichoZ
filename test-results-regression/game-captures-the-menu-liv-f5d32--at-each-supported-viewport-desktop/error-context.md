# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: game.spec.ts >> captures the menu, live playfield and pause state at each supported viewport
- Location: tests\e2e\game.spec.ts:322:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('dialog', { name: 'Woodstock — fase 1' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('dialog', { name: 'Woodstock — fase 1' }) with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'Woodstock — fase 1' })

```

```yaml
- link "Pular para o conteúdo":
  - /url: "#conteudo"
- banner:
  - link "psicoZ, início":
    - /url: "#inicio"
    - text: psicoZ
  - navigation "Navegação principal":
    - link "Álbum":
      - /url: "#album"
    - link "Artista":
      - /url: "#artista"
    - link "Faixas":
      - /url: "#faixas"
    - link "Jogo":
      - /url: "#jogo"
    - link "Coleção":
      - /url: "#colecao"
  - link "Explorar o visual":
    - /url: "#visual"
- main:
  - region "psicoZ":
    - paragraph:
      - text: Lançamento planejado
      - time: 31/10/2026
    - heading "psicoZ" [level=1]
    - text: Álbum 15 faixas Traço vermelho
    - paragraph: Ouça. Explore. Leve com você.
    - paragraph: 15 faixas, jogos curtos e uma coleção digital. Entre no universo preto, branco e vermelho.
    - button "Fazer pré-save"
    - link "Explorar o álbum":
      - /url: "#faixas"
    - link "Jogar Woodstock O primeiro de 15 jogos":
      - /url: "#/jogar/track-01"
    - figure "A arte é a porta de entrada. Toque na capa":
      - button "Abrir painel de pré-save de psicoZ":
        - 'img "Capa de psicoZ: colagem de desenhos vermelhos sobre preto, com mãos, olhos, correntes e figuras surreais."'
      - text: A arte é a porta de entrada. Toque na capa
  - text: 15 faixas ·Traço de tattoo ·Releituras jogáveis ·Progresso no seu aparelho
  - navigation "Explorar o álbum":
    - link "As 15 faixas":
      - /url: "#faixas"
    - link "Os 15 jogos":
      - /url: "#jogo"
    - link "Experiência visual":
      - /url: "#visual"
    - link "Sobre o projeto":
      - /url: "#album"
    - link "Minha coleção":
      - /url: "#colecao"
  - region "Entre frequências.":
    - paragraph: Um outro jeito de explorar
    - heading "Entre frequências." [level=2]
    - text: Estudo visual · sem áudio
    - group "Forma da visualização":
      - button "Relevo" [pressed]
      - button "Linhas"
      - button "Cores do espectro"
    - text: Perspectiva
    - slider "Perspectiva": "0"
    - paragraph: Mude a forma, a cor e o ponto de vista. As formas são abstratas e não representam o áudio das faixas.
  - region "15 maneiras de entrar.":
    - paragraph: O álbum, faixa a faixa
    - heading "15 maneiras de entrar." [level=2]
    - text: Nomes transcritos da contracapa
    - list "As 15 posições do álbum":
      - listitem:
        - text: Woodstock
        - link "Jogar a fase de Woodstock":
          - /url: "#/jogar/track-01"
          - text: Jogar fase 01
      - listitem:
        - text: Aditivo
        - link "Jogar a fase de Aditivo":
          - /url: "#/jogar/track-02"
          - text: Jogar fase 02
      - listitem:
        - text: Silêncio
        - link "Jogar a fase de Silêncio":
          - /url: "#/jogar/track-03"
          - text: Jogar fase 03
      - listitem:
        - text: Rumildo
        - link "Jogar a fase de Rumildo":
          - /url: "#/jogar/track-04"
          - text: Jogar fase 04
      - listitem:
        - text: Inverso
        - link "Jogar a fase de Inverso":
          - /url: "#/jogar/track-05"
          - text: Jogar fase 05
      - listitem:
        - text: Conhecida Ilusão
        - link "Jogar a fase de Conhecida Ilusão":
          - /url: "#/jogar/track-06"
          - text: Jogar fase 06
      - listitem:
        - text: Não Me Dizem Nada
        - link "Jogar a fase de Não Me Dizem Nada":
          - /url: "#/jogar/track-07"
          - text: Jogar fase 07
      - listitem:
        - text: Siblime
        - link "Jogar a fase de Siblime":
          - /url: "#/jogar/track-08"
          - text: Jogar fase 08
      - listitem:
        - text: PsicoZ
        - link "Jogar a fase de PsicoZ":
          - /url: "#/jogar/track-09"
          - text: Jogar fase 09
      - listitem:
        - text: Psicose feat Nobre
        - link "Jogar a fase de Psicose feat Nobre":
          - /url: "#/jogar/track-10"
          - text: Jogar fase 10
      - listitem:
        - text: Assumindo o Risco
        - link "Jogar a fase de Assumindo o Risco":
          - /url: "#/jogar/track-11"
          - text: Jogar fase 11
      - listitem:
        - text: Acapella
        - link "Jogar a fase de Acapella":
          - /url: "#/jogar/track-12"
          - text: Jogar fase 12
      - listitem:
        - text: Cidade Cinza
        - link "Jogar a fase de Cidade Cinza":
          - /url: "#/jogar/track-13"
          - text: Jogar fase 13
      - listitem:
        - text: Não Posso Errar
        - link "Jogar a fase de Não Posso Errar":
          - /url: "#/jogar/track-14"
          - text: Jogar fase 14
      - listitem:
        - text: A anunciar
        - link "Jogar a fase de faixa 15":
          - /url: "#/jogar/track-15"
          - text: Jogar fase 15
    - paragraph: As 14 faixas nomeadas seguem a contracapa fornecida. A posição 15 permanece reservada até a confirmação final.
    - figure "Contracapa de referência Arte original · posição 15 pendente":
      - img "Contracapa de referência com 14 títulos em lettering vermelho e uma posição reservada."
      - text: Contracapa de referência Arte original · posição 15 pendente
  - region "Muito além da escuta.":
    - figure "A mesma arte, sob outra luz. Encarte / psicoZ":
      - img "Variante clara da arte de psicoZ, com desenhos vermelhos sobre branco."
      - text: A mesma arte, sob outra luz. Encarte / psicoZ
    - paragraph: Sobre o álbum
    - heading "Muito além da escuta." [level=2]
    - paragraph: Conheça as imagens, acompanhe as 15 faixas e encontre sua coleção em um só lugar.
    - paragraph: O texto conceitual do álbum será apresentado aqui após aprovação do artista.
    - link "Conhecer a coleção":
      - /url: "#colecao"
  - region "O artista.":
    - paragraph: Por trás do álbum
    - heading "O artista." [level=2]
    - paragraph: Uma apresentação a caminho.
    - paragraph: Nome artístico e biografia aguardam confirmação. Este espaço será dedicado à voz e à história de quem criou psicoZ.
    - text: Redes e contato a anunciar
  - region "Entre nesse universo.":
    - paragraph: 15 faixas. 15 jogos.
    - heading "Entre nesse universo." [level=2]
    - paragraph: Escolha uma faixa e encare seu desafio. Cada vitória deixa uma marca na sua coleção. Jogue na ordem que quiser.
    - text: Seu percurso
    - progressbar "0 de 15 jogos conquistados"
    - paragraph: 0 de 15 jogos conquistados
    - list "Escolha um jogo por faixa":
      - listitem:
        - 'link "Jogar: Woodstock"':
          - /url: "#/jogar/track-01"
          - text: 01 Jogar
          - heading "Woodstock" [level=3]
          - paragraph: Liberte o sinal
          - paragraph: Restaure três selos e liberte a transmissão do labirinto.
          - text: Exploração 3D
      - listitem:
        - 'link "Jogar: Aditivo"':
          - /url: "#/jogar/track-02"
          - text: 02 Jogar
          - heading "Aditivo" [level=3]
          - paragraph: Arquivo proibido
          - paragraph: Encontre os quatro arquivos e alcance a porta da cidade.
          - text: Exploração
      - listitem:
        - 'link "Jogar: Silêncio"':
          - /url: "#/jogar/track-03"
          - text: 03 Jogar
          - heading "Silêncio" [level=3]
          - paragraph: Corra do silêncio
          - paragraph: Atravesse 16 grades e buracos até o fim do percurso.
          - text: Corrida
      - listitem:
        - 'link "Jogar: Rumildo"':
          - /url: "#/jogar/track-04"
          - text: 04 Jogar
          - heading "Rumildo" [level=3]
          - paragraph: Ritual de ruptura
          - paragraph: Interrompa oito sentinelas e sobreviva à arena.
          - text: Arena
      - listitem:
        - 'link "Jogar: Inverso"':
          - /url: "#/jogar/track-05"
          - text: 05 Jogar
          - heading "Inverso" [level=3]
          - paragraph: Entre as falhas
          - paragraph: Recupere os oito olhos das plataformas e alcance a porta final.
          - text: Plataforma
      - listitem:
        - 'link "Jogar: Conhecida Ilusão"':
          - /url: "#/jogar/track-06"
          - text: 06 Jogar
          - heading "Conhecida Ilusão" [level=3]
          - paragraph: Duplo negativo
          - paragraph: Encontre os seis pares escondidos sem esgotar as tentativas.
          - text: Memória
      - listitem:
        - 'link "Jogar: Não Me Dizem Nada"':
          - /url: "#/jogar/track-07"
          - text: 07 Jogar
          - heading "Não Me Dizem Nada" [level=3]
          - paragraph: Estrada sem voz
          - paragraph: Desvie de 16 barricadas, pegue 12 olhos e chegue ao fim da estrada.
          - text: Direção
      - listitem:
        - 'link "Jogar: Siblime"':
          - /url: "#/jogar/track-08"
          - text: 08 Jogar
          - heading "Siblime" [level=3]
          - paragraph: Curto-circuito
          - paragraph: Deixe os nove selos vermelhos em até 24 movimentos.
          - text: Circuito
      - listitem:
        - 'link "Jogar: PsicoZ"':
          - /url: "#/jogar/track-09"
          - text: 09 Jogar
          - heading "PsicoZ" [level=3]
          - paragraph: Cerco vermelho
          - paragraph: Interrompa 12 sentinelas e encerre o cerco.
          - text: Arena
      - listitem:
        - 'link "Jogar: Psicose feat Nobre"':
          - /url: "#/jogar/track-10"
          - text: 10 Jogar
          - heading "Psicose feat Nobre" [level=3]
          - paragraph: Pulso interrompido
          - paragraph: Acerte pelo menos 18 dos 24 pulsos na zona vermelha.
          - text: Ritmo visual
      - listitem:
        - 'link "Jogar: Assumindo o Risco"':
          - /url: "#/jogar/track-11"
          - text: 11 Jogar
          - heading "Assumindo o Risco" [level=3]
          - paragraph: Caçada na contramão
          - paragraph: Escape da perseguição atravessando 16 grades e buracos.
          - text: Perseguição
      - listitem:
        - 'link "Jogar: Acapella"':
          - /url: "#/jogar/track-12"
          - text: 12 Jogar
          - heading "Acapella" [level=3]
          - paragraph: A última voz
          - paragraph: Acerte 28 impactos no núcleo e sobreviva aos projéteis.
          - text: Chefe
      - listitem:
        - 'link "Jogar: Cidade Cinza"':
          - /url: "#/jogar/track-13"
          - text: 13 Jogar
          - heading "Cidade Cinza" [level=3]
          - paragraph: Quarteirão fechado
          - paragraph: Encontre quatro arquivos e atravesse o labirinto até a porta.
          - text: Labirinto
      - listitem:
        - 'link "Jogar: Não Posso Errar"':
          - /url: "#/jogar/track-14"
          - text: 14 Jogar
          - heading "Não Posso Errar" [level=3]
          - paragraph: Não quebre o rito
          - paragraph: Repita quatro sequências, de três até seis símbolos.
          - text: Sequência
      - listitem:
        - 'link "Jogar: Faixa 15 — título a anunciar"':
          - /url: "#/jogar/track-15"
          - text: 15 Jogar
          - heading "Faixa 15 — título a anunciar" [level=3]
          - paragraph: O último selo
          - paragraph: "Supere três provas: memória, circuito e sequência."
          - text: Desafio final
    - paragraph: Preto, papel e vermelho. Um desafio por faixa.
    - paragraph: Protótipos jogáveis para PC e celular. As músicas e os arquivos para download ainda estão em preparação; conquistar uma fase registra seu progresso local.
    - link "Jogar Woodstock":
      - /url: "#/jogar/track-01"
    - link "Ver minha coleção":
      - /url: "#colecao"
  - region "Sua coleção.":
    - paragraph: Para levar com você
    - heading "Sua coleção." [level=2]
    - paragraph: 0 de 15 faixas conquistadas no jogo
    - status: Cada faixa tem um jogo. Complete os objetivos para registrar suas conquistas; a edição NFC libera acesso aos materiais publicados. Seu progresso fica salvo neste navegador.
    - heading "Músicas e materiais" [level=3]
    - text: Arquivos em preparação
    - list:
      - listitem:
        - text: "01"
        - paragraph: Woodstock — MP3
        - text: Acesso ainda não conquistado Em breve
      - listitem:
        - text: "02"
        - paragraph: Aditivo — MP3
        - text: Acesso ainda não conquistado Em breve
      - listitem:
        - text: "03"
        - paragraph: Silêncio — MP3
        - text: Acesso ainda não conquistado Em breve
      - listitem:
        - text: "04"
        - paragraph: Rumildo — MP3
        - text: Acesso ainda não conquistado Em breve
      - listitem:
        - text: "05"
        - paragraph: Inverso — MP3
        - text: Acesso ainda não conquistado Em breve
      - listitem:
        - text: "06"
        - paragraph: Conhecida Ilusão — MP3
        - text: Acesso ainda não conquistado Em breve
      - listitem:
        - text: "07"
        - paragraph: Não Me Dizem Nada — MP3
        - text: Acesso ainda não conquistado Em breve
      - listitem:
        - text: "08"
        - paragraph: Siblime — MP3
        - text: Acesso ainda não conquistado Em breve
      - listitem:
        - text: "09"
        - paragraph: PsicoZ — MP3
        - text: Acesso ainda não conquistado Em breve
      - listitem:
        - text: "10"
        - paragraph: Psicose feat Nobre — MP3
        - text: Acesso ainda não conquistado Em breve
      - listitem:
        - text: "11"
        - paragraph: Assumindo o Risco — MP3
        - text: Acesso ainda não conquistado Em breve
      - listitem:
        - text: "12"
        - paragraph: Acapella — MP3
        - text: Acesso ainda não conquistado Em breve
      - listitem:
        - text: "13"
        - paragraph: Cidade Cinza — MP3
        - text: Acesso ainda não conquistado Em breve
      - listitem:
        - text: "14"
        - paragraph: Não Posso Errar — MP3
        - text: Acesso ainda não conquistado Em breve
      - listitem:
        - text: "15"
        - paragraph: Faixa 15 — MP3
        - text: Acesso ainda não conquistado Em breve
      - listitem:
        - text: ✧
        - paragraph: Arte do álbum — PNG
        - text: Acesso ainda não conquistado Em breve
      - listitem:
        - text: ✧
        - paragraph: Álbum completo — ZIP
        - text: Acesso ainda não conquistado Em breve
    - complementary "Do físico ao digital.":
      - heading "Do físico ao digital." [level=3]
      - paragraph: Aproxime o mini CD NFC de um celular compatível para abrir a coleção e liberar acesso aos materiais publicados.
      - paragraph: O endereço da tag é compartilhável. Ele libera acesso, mas não conta como conquista no jogo.
      - group: Como funciona o acesso?
    - group: Seu progresso neste aparelho
- contentinfo:
  - link "psicoZ":
    - /url: "#inicio"
  - paragraph: Álbum, arte e outros caminhos.
  - paragraph: Créditos artísticos e técnicos aguardam confirmação.
  - link "Voltar ao início":
    - /url: "#inicio"
- status
- dialog "Woodstock — fase 01":
  - region "Woodstock":
    - text: psicoZ 01 / Frequência aprisionada
    - paragraph: O concreto guarda um sinal. Você pode libertá-lo.
    - heading "Woodstock" [level=2]
    - strong: Liberte o sinal.
    - paragraph: Três selos mantêm a transmissão presa neste labirinto. Restaure os altares, enfrente ou drible a sentinela e leve o sinal até a torre.
    - list:
      - listitem: 01 / Olho Revele o sinal
      - listitem: 02 / Mão Recupere a força
      - listitem: 03 / Elo Rompa o bloqueio
    - paragraph: Cada selo recupera até 25 de integridade. Liberte a transmissão para conquistar o mini CD digital de Woodstock.
    - group "Como você vai jogar":
      - button "Mouse + teclado" [pressed]
      - button "Controles de toque"
    - paragraph: WASD para mover. Mouse para mirar. Clique para disparar. E para recolher. Esc libera o cursor e pausa.
    - button "Entrar no labirinto ↗"
    - button "Voltar à home"
    - checkbox "Ativar áudio de teste"
    - text: Ativar áudio de teste
    - paragraph: Som demonstrativo original. Não é a música Woodstock.
    - group: Controles e ajustes
    - group: Mapa do labirinto
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | import { mkdir } from 'node:fs/promises';
  3   | import { resolve } from 'node:path';
  4   | 
  5   | const PROGRESS_KEY = 'psicoz:progress';
  6   | const GAME_ROUTE = '/#/jogar/track-01';
  7   | const captures = resolve('docs/screenshots/game-controls-2026-09-21');
  8   | const runtimeScript = /\/assets\/runtime-[^/]+\.js(?:[?#]|$)/u;
  9   | const audioFile = /\.(?:mp3|wav|ogg|m4a)(?:[?#]|$)/iu;
  10  | 
  11  | async function ready(page: Page): Promise<void> {
  12  |   await page.goto(GAME_ROUTE);
> 13  |   await expect(page.getByRole('dialog', { name: 'Woodstock — fase 1' })).toBeVisible();
      |                                                                          ^ Error: expect(locator).toBeVisible() failed
  14  |   await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'ready');
  15  |   await expect(page.locator('.game-world canvas')).toHaveCount(1);
  16  | }
  17  | 
  18  | async function start(page: Page, isMobile: boolean): Promise<void> {
  19  |   if (!isMobile && !(await page.locator('[data-keyboard]').isVisible())) {
  20  |     await page.locator('[data-controls] > summary').click();
  21  |   }
  22  |   await page.locator(isMobile ? '[data-start]' : '[data-keyboard]').click();
  23  |   await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'playing');
  24  |   await expect(page.locator('.game-world canvas')).toBeFocused();
  25  | }
  26  | 
  27  | async function pause(page: Page): Promise<void> {
  28  |   await page.getByRole('button', { name: 'Pausar partida' }).click();
  29  |   await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'paused');
  30  | }
  31  | 
  32  | async function mapPosition(page: Page): Promise<{ x: number; z: number; rotation: number }> {
  33  |   const transform = await page.locator('[data-map-player]').getAttribute('transform');
  34  |   const match = /^translate\(([-.\d]+) ([-.\d]+)\) rotate\(([-.\d]+)\)$/u.exec(transform ?? '');
  35  |   expect(match, 'The visible pause map must report the player position').not.toBeNull();
  36  |   return { x: Number(match![1]), z: Number(match![2]), rotation: Number(match![3]) };
  37  | }
  38  | 
  39  | async function expectNoReward(page: Page): Promise<void> {
  40  |   const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), PROGRESS_KEY);
  41  |   expect(progress.completedLevelIds ?? []).toEqual([]);
  42  |   expect(progress.unlockedTrackIds ?? []).toEqual([]);
  43  |   expect(progress.collectibles ?? []).toEqual([]);
  44  |   await expect(page.locator('a[download]')).toHaveCount(0);
  45  | }
  46  | 
  47  | test('loads the game only after an explicit route, begins silently and releases it on exit', async ({ page, isMobile }) => {
  48  |   const scripts: string[] = [];
  49  |   const audioRequests: string[] = [];
  50  |   const errors: string[] = [];
  51  |   page.on('request', (request) => {
  52  |     if (request.resourceType() === 'script') scripts.push(request.url());
  53  |     if (audioFile.test(request.url())) audioRequests.push(request.url());
  54  |   });
  55  |   page.on('pageerror', (error) => errors.push(error.message));
  56  |   await page.goto('/');
  57  |   await expect(page.locator('#tracklist > li')).toHaveCount(15);
  58  |   expect(scripts.filter((url) => runtimeScript.test(url))).toEqual([]);
  59  |   await expect(page.locator('#game-dialog, canvas')).toHaveCount(0);
  60  |   await page.locator('#jogo').getByRole('link', { name: 'Jogar Woodstock' }).click();
  61  |   await expect(page).toHaveURL(/#\/jogar\/track-01$/u);
  62  |   await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'ready');
  63  |   expect(scripts.filter((url) => runtimeScript.test(url))).toHaveLength(1);
  64  |   await expect(page.getByRole('checkbox', { name: 'Ativar áudio de teste' })).not.toBeChecked();
  65  |   await start(page, isMobile);
  66  |   await page.keyboard.press('Space');
  67  |   await pause(page);
  68  |   expect(audioRequests).toEqual([]);
  69  |   await page.getByRole('button', { name: 'Voltar à home' }).click();
  70  |   await expect(page).toHaveURL(/#jogo$/u);
  71  |   await expect(page.locator('#game-dialog, canvas')).toHaveCount(0);
  72  |   await expect(page.locator('body')).not.toHaveClass(/game-open/u);
  73  |   await expectNoReward(page);
  74  |   await page.locator('#jogo').getByRole('link', { name: 'Jogar Woodstock' }).click();
  75  |   await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'ready');
  76  |   await expect(page.locator('.game-world canvas')).toHaveCount(1);
  77  |   await expect(page.locator('[data-symbol-count]')).toHaveText('0 / 3');
  78  |   expect(scripts.filter((url) => runtimeScript.test(url))).toHaveLength(1);
  79  |   expect(errors).toEqual([]);
  80  | });
  81  | 
  82  | test('direct route and reload keep menus keyboard-contained with honest audio settings', async ({ page, isMobile }) => {
  83  |   await ready(page);
  84  |   const enter = page.getByRole('button', { name: 'Entrar no labirinto' });
  85  |   const first = page.locator('[data-control-mode="mouse"]');
  86  |   const map = page.getByText('Mapa do labirinto', { exact: true });
  87  |   await expect(enter).toBeFocused();
  88  |   await first.focus();
  89  |   await page.keyboard.press('Shift+Tab');
  90  |   await expect(map).toBeFocused();
  91  |   await page.keyboard.press('Tab');
  92  |   await expect(first).toBeFocused();
  93  |   await expect(page.locator('details[data-controls]')).not.toHaveAttribute('open', '');
  94  |   await expect(page.locator('.game-map-details')).not.toHaveAttribute('open', '');
  95  |   await expect(page.locator('.game-demo-note')).toHaveText('Som demonstrativo original. Não é a música Woodstock.');
  96  |   await page.getByText('Controles e ajustes', { exact: true }).click();
  97  |   await expect(page.getByRole('slider', { name: 'Sensibilidade', exact: true })).toHaveValue('1');
  98  |   await expect(page.getByRole('slider', { name: 'Música de teste', exact: true })).toHaveValue('0.3');
  99  |   await expect(page.getByRole('slider', { name: 'Efeitos', exact: true })).toHaveValue('0.3');
  100 |   for (const name of ['Sensibilidade', 'Música de teste', 'Efeitos']) {
  101 |     const slider = page.getByRole('slider', { name, exact: true });
  102 |     await slider.scrollIntoViewIfNeeded();
  103 |     await expect(slider).toBeInViewport();
  104 |     const box = await slider.boundingBox();
  105 |     expect(box!.height).toBeGreaterThanOrEqual(44);
  106 |     expect(box!.x).toBeGreaterThanOrEqual(0);
  107 |     expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  108 |   }
  109 |   await page.getByRole('checkbox', { name: 'Reduzir movimento', exact: true }).check();
  110 |   await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  111 |   await page.reload();
  112 |   await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'ready');
  113 |   await page.getByText('Controles e ajustes', { exact: true }).click();
```
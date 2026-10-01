# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: upstream-actions.spec.ts >> copied Snake recovers six real food items using rendered grid and ordinary direction keys
- Location: tests\e2e\upstream-actions.spec.ts:68:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('[data-game-status]')
Expected substring: "GOTAS 0 / 6"
Received string:    ""
Timeout: 5000ms

Call log:
  - Expect "toContainText" locator('[data-game-status]') with timeout 5000ms
  - waiting for locator('[data-game-status]')
    14 × locator resolved to <p data-game-status=""></p>
       - unexpected value ""

```

```yaml
- paragraph
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | 
  3   | const origin = process.env.PSICOZ_GAMES_URL ?? 'http://127.0.0.1:4173';
  4   | for (const game of ['snake', 'pong', 'tetris', 'racer', 'breakout']) {
  5   |   test(`copied ${game} boots offline with real controls and local assets`, async ({ page }, info) => {
  6   |     const errors: string[] = [], failed: string[] = [], remote: string[] = [];
  7   |     page.on('pageerror', error => errors.push(error.message));
  8   |     page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });
  9   |     page.on('request', request => { if (!request.url().startsWith(origin)) remote.push(request.url()); });
  10  |     await page.goto(`${origin}/games/${game}/index.html`);
  11  |     await expect(page.locator('[data-game-status]')).not.toHaveText('');
  12  |     await expect(page.locator('canvas').first()).toBeVisible();
  13  |     const button = page.locator('.touch-controls button').first();
  14  |     await button.click();
  15  |     if (game === 'racer') { await page.keyboard.down('ArrowUp'); await page.waitForTimeout(1600); await page.keyboard.up('ArrowUp'); }
  16  |     else await page.waitForTimeout(600);
  17  |     await page.screenshot({ path: info.outputPath(`${game}-playing.png`) });
  18  |     expect(errors).toEqual([]);
  19  |     expect(failed).toEqual([]);
  20  |     expect(remote).toEqual([]);
  21  |   });
  22  | }
  23  | 
  24  | test('copied Tetris clears its real goal through rotation, movement and hard-drop controls', async ({ page }, info) => {
  25  |   test.setTimeout(90000);
  26  |   await page.clock.install({ time: new Date('2026-09-30T15:00:00Z') });
  27  |   await page.clock.pauseAt(new Date('2026-09-30T15:00:01Z'));
  28  |   await page.goto(`${origin}/games/tetris/index.html`);
  29  |   await expect(page.locator('[data-game-status]')).toContainText('LINHAS 0 / 2');
  30  |   for (let piece = 0; piece < 65; piece++) {
  31  |     if (await page.locator('[data-game-status]').textContent().then(text => /LINHAS [2-9]/.test(text ?? ''))) break;
  32  |     // Read the unmodified upstream board and visible piece; never call game rules or assign state.
  33  |     const state = await page.evaluate(() => {
  34  |       const game = window as unknown as { nx: number; ny: number; blocks: Array<Array<unknown>>; current: { type: { blocks: number[] }; dir: number; x: number; y: number } };
  35  |       return { current: game.current, board: Array.from({ length: game.ny }, (_, y) => Array.from({ length: game.nx }, (_, x) => Boolean(game.blocks[x]?.[y]))) };
  36  |     });
  37  |     let best = { value: Infinity, x: 0, direction: 0 };
  38  |     for (let direction = 0; direction < 4; direction++) for (let x = -3; x < 10; x++) {
  39  |       const cells: Array<[number, number]> = [];
  40  |       for (let bit = 0; bit < 16; bit++) if (state.current.type.blocks[direction] & (0x8000 >> bit)) cells.push([bit % 4, Math.floor(bit / 4)]);
  41  |       const fits = (y: number) => cells.every(([dx, dy]) => x + dx >= 0 && x + dx < 10 && y + dy < 20 && !state.board[y + dy]?.[x + dx]);
  42  |       if (!fits(state.current.y)) continue;
  43  |       let y = state.current.y;
  44  |       while (fits(y + 1)) y++;
  45  |       const board = state.board.map(row => [...row]);
  46  |       for (const [dx, dy] of cells) board[y + dy][x + dx] = true;
  47  |       const lines = board.filter(row => row.every(Boolean)).length;
  48  |       const remaining = board.filter(row => !row.every(Boolean));
  49  |       while (remaining.length < 20) remaining.unshift(Array(10).fill(false));
  50  |       const heights = Array.from({ length: 10 }, (_, col) => { const top = remaining.findIndex(row => row[col]); return top < 0 ? 0 : 20 - top; });
  51  |       let holes = 0;
  52  |       for (let col = 0; col < 10; col++) for (let row = 20 - heights[col]; row < 20; row++) if (!remaining[row][col]) holes++;
  53  |       const bumpiness = heights.slice(1).reduce((sum, height, index) => sum + Math.abs(height - heights[index]), 0);
  54  |       const value = heights.reduce((a, b) => a + b, 0) * .51 + holes * 8 + bumpiness * .25 - lines * 9;
  55  |       if (value < best.value) best = { value, x, direction };
  56  |     }
  57  |     const rotation = (best.direction - state.current.dir + 4) % 4;
  58  |     for (let i = 0; i < rotation; i++) { await page.keyboard.press('ArrowUp'); await page.clock.runFor(20); }
  59  |     const moved = await page.evaluate(() => (window as unknown as { current: { x: number } }).current.x);
  60  |     for (let i = 0; i < Math.abs(best.x - moved); i++) { await page.keyboard.press(best.x > moved ? 'ArrowRight' : 'ArrowLeft'); await page.clock.runFor(20); }
  61  |     await page.locator('#drop').click();
  62  |     await page.clock.runFor(20);
  63  |   }
  64  |   await expect(page.locator('[data-game-status]')).toContainText(/LINHAS [2-9] \/ 2/);
  65  |   await page.screenshot({ path: info.outputPath('upstream-tetris-cleared.png') });
  66  | });
  67  | 
  68  | test('copied Snake recovers six real food items using rendered grid and ordinary direction keys', async ({ page }, info) => {
  69  |   test.setTimeout(60000);
  70  |   await page.clock.install({ time: new Date('2026-09-30T16:00:00Z') });
  71  |   await page.clock.pauseAt(new Date('2026-09-30T16:00:01Z'));
  72  |   await page.goto(`${origin}/games/snake/index.html`);
> 73  |   await expect(page.locator('[data-game-status]')).toContainText('GOTAS 0 / 6');
      |                                                    ^ Error: expect(locator).toContainText(expected) failed
  74  |   await page.clock.runFor(20);
  75  |   let direction = [1, 0];
  76  |   for (let turn = 0; turn < 240; turn++) {
  77  |     if ((await page.locator('[data-game-status]').textContent())?.includes('GOTAS 6 / 6')) break;
  78  |     const grid = await page.locator('canvas').evaluate(element => {
  79  |       const canvas = element as HTMLCanvasElement, context = canvas.getContext('2d')!;
  80  |       const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  81  |       const color = (x: number, y: number) => [...pixels.slice((y * canvas.width + x) * 4, (y * canvas.width + x) * 4 + 3)];
  82  |       const red = (p: number[]) => p[0] > 230 && p[1] < 80 && p[2] < 100;
  83  |       let head: number[] = [], food: number[] = [];
  84  |       const body: string[] = [];
  85  |       for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
  86  |         const middle = color(x * 24 + 12, y * 24 + 12);
  87  |         if (red(middle)) { if (red(color(x * 24 + 3, y * 24 + 3))) head = [x, y]; else food = [x, y]; }
  88  |         else if (middle.every(value => value < 20)) body.push(`${x},${y}`);
  89  |       }
  90  |       return { head, food, body };
  91  |     });
  92  |     expect(grid.head).toHaveLength(2); expect(grid.food).toHaveLength(2);
  93  |     const queue: Array<{ position: number[]; first: number[] | null }> = [{ position: grid.head, first: null }];
  94  |     const visited = new Set(grid.body); visited.add(grid.head.join(','));
  95  |     let next: number[] | null = null;
  96  |     while (queue.length) {
  97  |       const item = queue.shift()!;
  98  |       if (item.position[0] === grid.food[0] && item.position[1] === grid.food[1]) { next = item.first; break; }
  99  |       for (const move of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
  100 |         if (!item.first && move[0] === -direction[0] && move[1] === -direction[1]) continue;
  101 |         const position = [(item.position[0] + move[0] + 16) % 16, (item.position[1] + move[1] + 16) % 16];
  102 |         if (visited.has(position.join(','))) continue;
  103 |         visited.add(position.join(',')); queue.push({ position, first: item.first ?? move });
  104 |       }
  105 |     }
  106 |     expect(next, 'There must be a visible route to the next food').not.toBeNull(); direction = next!;
  107 |     await page.keyboard.press(direction[0] > 0 ? 'ArrowRight' : direction[0] < 0 ? 'ArrowLeft' : direction[1] > 0 ? 'ArrowDown' : 'ArrowUp');
  108 |     await page.clock.runFor(40);
  109 |   }
  110 |   await expect(page.locator('[data-game-status]')).toContainText('GOTAS 6 / 6');
  111 |   await page.screenshot({ path: info.outputPath('upstream-snake-six-food.png') });
  112 | });
  113 | 
```
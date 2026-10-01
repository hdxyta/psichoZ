import { expect, test } from '@playwright/test';

const origin = process.env.PSICOZ_GAMES_URL ?? 'http://127.0.0.1:4173';
for (const game of ['snake', 'pong', 'tetris', 'racer', 'breakout']) {
  test(`copied ${game} boots offline with real controls and local assets`, async ({ page }, info) => {
    const errors: string[] = [], failed: string[] = [], remote: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });
    page.on('request', request => { if (!request.url().startsWith(origin)) remote.push(request.url()); });
    await page.goto(`${origin}/games/${game}/index.html`);
    await expect(page.locator('[data-game-status]')).not.toHaveText('');
    await expect(page.locator('canvas').first()).toBeVisible();
    const button = page.locator('.touch-controls button').first();
    await button.click();
    if (game === 'racer') { await page.keyboard.down('ArrowUp'); await page.waitForTimeout(1600); await page.keyboard.up('ArrowUp'); }
    else await page.waitForTimeout(600);
    await page.screenshot({ path: info.outputPath(`${game}-playing.png`) });
    expect(errors).toEqual([]);
    expect(failed).toEqual([]);
    expect(remote).toEqual([]);
  });
}

test('copied Tetris clears its real goal through rotation, movement and hard-drop controls', async ({ page }, info) => {
  test.setTimeout(90000);
  await page.clock.install({ time: new Date('2026-09-30T15:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-30T15:00:01Z'));
  await page.goto(`${origin}/games/tetris/index.html`);
  await expect(page.locator('[data-game-status]')).toContainText('LINHAS 0 / 2');
  for (let piece = 0; piece < 65; piece++) {
    if (await page.locator('[data-game-status]').textContent().then(text => /LINHAS [2-9]/.test(text ?? ''))) break;
    // Read the unmodified upstream board and visible piece; never call game rules or assign state.
    const state = await page.evaluate(() => {
      const game = window as unknown as { nx: number; ny: number; blocks: Array<Array<unknown>>; current: { type: { blocks: number[] }; dir: number; x: number; y: number } };
      return { current: game.current, board: Array.from({ length: game.ny }, (_, y) => Array.from({ length: game.nx }, (_, x) => Boolean(game.blocks[x]?.[y]))) };
    });
    let best = { value: Infinity, x: 0, direction: 0 };
    for (let direction = 0; direction < 4; direction++) for (let x = -3; x < 10; x++) {
      const cells: Array<[number, number]> = [];
      for (let bit = 0; bit < 16; bit++) if (state.current.type.blocks[direction] & (0x8000 >> bit)) cells.push([bit % 4, Math.floor(bit / 4)]);
      const fits = (y: number) => cells.every(([dx, dy]) => x + dx >= 0 && x + dx < 10 && y + dy < 20 && !state.board[y + dy]?.[x + dx]);
      if (!fits(state.current.y)) continue;
      let y = state.current.y;
      while (fits(y + 1)) y++;
      const board = state.board.map(row => [...row]);
      for (const [dx, dy] of cells) board[y + dy][x + dx] = true;
      const lines = board.filter(row => row.every(Boolean)).length;
      const remaining = board.filter(row => !row.every(Boolean));
      while (remaining.length < 20) remaining.unshift(Array(10).fill(false));
      const heights = Array.from({ length: 10 }, (_, col) => { const top = remaining.findIndex(row => row[col]); return top < 0 ? 0 : 20 - top; });
      let holes = 0;
      for (let col = 0; col < 10; col++) for (let row = 20 - heights[col]; row < 20; row++) if (!remaining[row][col]) holes++;
      const bumpiness = heights.slice(1).reduce((sum, height, index) => sum + Math.abs(height - heights[index]), 0);
      const value = heights.reduce((a, b) => a + b, 0) * .51 + holes * 8 + bumpiness * .25 - lines * 9;
      if (value < best.value) best = { value, x, direction };
    }
    const rotation = (best.direction - state.current.dir + 4) % 4;
    for (let i = 0; i < rotation; i++) { await page.keyboard.press('ArrowUp'); await page.clock.runFor(20); }
    const moved = await page.evaluate(() => (window as unknown as { current: { x: number } }).current.x);
    for (let i = 0; i < Math.abs(best.x - moved); i++) { await page.keyboard.press(best.x > moved ? 'ArrowRight' : 'ArrowLeft'); await page.clock.runFor(20); }
    await page.locator('#drop').click();
    await page.clock.runFor(20);
  }
  await expect(page.locator('[data-game-status]')).toContainText(/LINHAS [2-9] \/ 2/);
  await page.screenshot({ path: info.outputPath('upstream-tetris-cleared.png') });
});

test('copied Snake recovers six real food items using rendered grid and ordinary direction keys', async ({ page }, info) => {
  test.setTimeout(60000);
  await page.clock.install({ time: new Date('2026-09-30T16:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-30T16:00:01Z'));
  await page.goto(`${origin}/games/snake/index.html`);
  await page.clock.runFor(20);
  await expect(page.locator('[data-game-status]')).toContainText('GOTAS 0 / 6');
  let direction = [1, 0];
  for (let turn = 0; turn < 240; turn++) {
    if ((await page.locator('[data-game-status]').textContent())?.includes('GOTAS 6 / 6')) break;
    const grid = await page.locator('canvas').evaluate(element => {
      const canvas = element as HTMLCanvasElement, context = canvas.getContext('2d')!;
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const color = (x: number, y: number) => [...pixels.slice((y * canvas.width + x) * 4, (y * canvas.width + x) * 4 + 3)];
      const red = (p: number[]) => p[0] > 230 && p[1] < 80 && p[2] < 100;
      let head: number[] = [], food: number[] = [];
      const body: string[] = [];
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const middle = color(x * 24 + 12, y * 24 + 12);
        if (red(middle)) { if (red(color(x * 24 + 3, y * 24 + 3))) head = [x, y]; else food = [x, y]; }
        else if (middle.every(value => value < 20)) body.push(`${x},${y}`);
      }
      return { head, food, body };
    });
    expect(grid.head).toHaveLength(2); expect(grid.food).toHaveLength(2);
    const queue: Array<{ position: number[]; first: number[] | null }> = [{ position: grid.head, first: null }];
    const visited = new Set(grid.body); visited.add(grid.head.join(','));
    let next: number[] | null = null;
    while (queue.length) {
      const item = queue.shift()!;
      if (item.position[0] === grid.food[0] && item.position[1] === grid.food[1]) { next = item.first; break; }
      for (const move of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        if (!item.first && move[0] === -direction[0] && move[1] === -direction[1]) continue;
        const position = [(item.position[0] + move[0] + 16) % 16, (item.position[1] + move[1] + 16) % 16];
        if (visited.has(position.join(','))) continue;
        visited.add(position.join(',')); queue.push({ position, first: item.first ?? move });
      }
    }
    expect(next, 'There must be a visible route to the next food').not.toBeNull(); direction = next!;
    await page.keyboard.press(direction[0] > 0 ? 'ArrowRight' : direction[0] < 0 ? 'ArrowLeft' : direction[1] > 0 ? 'ArrowDown' : 'ArrowUp');
    await page.clock.runFor(40);
  }
  await expect(page.locator('[data-game-status]')).toContainText('GOTAS 6 / 6');
  await page.screenshot({ path: info.outputPath('upstream-snake-six-food.png') });
});

import { expect, test, type Page } from '@playwright/test';

const root = '.arcade-game';
const key = 'psicoz:progress';
async function open(page: Page, track: string) {
  await page.clock.install({ time: new Date('2026-09-30T12:00:00Z') });
  await page.goto(`/?qa=action-inputs#/jogar/${track}`);
  await expect(page.locator(root)).toHaveAttribute('data-screen', 'ready');
  await page.locator('[data-motion]').check();
  await page.clock.pauseAt(new Date('2026-09-30T12:00:10Z'));
  await page.locator('[data-start]').click();
  await expect(page.locator(root)).toHaveAttribute('data-screen', 'playing');
}
async function saved(page: Page) {
  return page.evaluate((name) => JSON.parse(localStorage.getItem(name) ?? '{}'), key);
}
async function canvasAt(page: Page, x: number, y: number) {
  const box = await page.locator('.arcade-stage canvas').boundingBox();
  return { x: box!.x + x / 960 * box!.width, y: box!.y + y / 540 * box!.height };
}

test('Inverso can be completed using held direction and timed physical jumps', async ({ page }, info) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page, 'track-05');
  await page.keyboard.down('ArrowRight');
  // These are authored ledges/grades, converted to movement time; only real keys reach the game.
  const jumps = [420, 950, 1490, 1724, 2030, 2570, 3110, 3344, 3650, 4190];
  let elapsed = 0;
  for (const x of jumps) {
    const at = Math.round((x - 100) / 220 * 1000);
    await page.clock.runFor(at - elapsed);
    elapsed = at;
    await expect(page.locator(root)).toHaveAttribute('data-screen', 'playing');
    await page.keyboard.press('Space');
  }
  await page.clock.runFor(2600);
  await page.keyboard.up('ArrowRight');
  await expect(page.locator(root)).toHaveAttribute('data-screen', 'won');
  await expect(page.locator('[data-score]')).toHaveText('Fragmentos recuperados 8 / 8');
  const progress = await saved(page);
  expect(progress.completedLevelIds).toContain('level-05');
  expect(progress.unlockedTrackIds).toContain('track-05');
  expect(errors).toEqual([]);
  await page.screenshot({ path: info.outputPath('platform-won.png') });
});

test('road course is completed through pointer lane changes and persists only the real finish', async ({ page }, info) => {
  test.setTimeout(60000);
  await open(page, 'track-07');
  let elapsed = 0;
  for (let row = 0; row < 16; row++) {
    const lane = row * 2 % 3;
    const position = await canvasAt(page, 330 + lane * 150, 425);
    await page.mouse.click(position.x, position.y);
    const at = Math.round((760 + row * 490 + 65) / 170 * 1000);
    await page.clock.runFor(at - elapsed);
    elapsed = at;
    await expect(page.locator(root)).toHaveAttribute('data-screen', 'playing');
    if (row === 5) await page.screenshot({ path: info.outputPath('drive-playing.png') });
  }
  expect((await saved(page)).completedLevelIds).not.toContain('level-07');
  await page.clock.runFor(5200);
  await expect(page.locator(root)).toHaveAttribute('data-screen', 'won');
  expect((await saved(page)).completedLevelIds).toContain('level-07');
  await page.screenshot({ path: info.outputPath('drive-won.png') });
});

test('pit loss, restart, pause and dash follow the actual action lifecycle', async ({ page }, info) => {
  await open(page, 'track-05');
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(2600);
  await page.keyboard.up('ArrowRight');
  await expect(page.locator(root)).toHaveAttribute('data-screen', 'lost');
  expect((await saved(page)).completedLevelIds).not.toContain('level-05');
  await page.locator('[data-restart]').click();
  await expect(page.locator(root)).toHaveAttribute('data-screen', 'playing');
  await expect(page.locator('[data-score]')).toHaveText('Fragmentos recuperados 0 / 8');
  await page.keyboard.press('Shift');
  await page.clock.runFor(250);
  await page.keyboard.press('p');
  await expect(page.locator(root)).toHaveAttribute('data-screen', 'paused');
  const timer = await page.locator('[data-time]').textContent();
  const image = await page.locator('canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL());
  await page.clock.runFor(12000);
  await expect(page.locator('[data-time]')).toHaveText(timer!);
  expect(await page.locator('canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL())).toBe(image);
  await page.locator('[data-start]').click();
  await page.clock.runFor(1500);
  await expect(page.locator(root)).toHaveAttribute('data-screen', 'playing');
  expect((await saved(page)).completedLevelIds).not.toContain('level-05');
  await page.screenshot({ path: info.outputPath('platform-after-resume.png') });
});

test('touch move and jump work simultaneously and touch cancellation releases movement', async ({ page, context, isMobile }, info) => {
  test.skip(!isMobile, 'Uses actual multi-touch events in the mobile browser project.');
  await open(page, 'track-05');
  const session = await context.newCDPSession(page);
  const right = await page.locator('[data-move="right"]').boundingBox();
  const jump = await page.locator('[data-primary]').boundingBox();
  const points = [{ id: 1, x: right!.x + right!.width / 2, y: right!.y + right!.height / 2 }, { id: 2, x: jump!.x + jump!.width / 2, y: jump!.y + jump!.height / 2 }];
  await page.clock.runFor(32);
  const original = await page.locator('canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL());
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points });
  await page.clock.runFor(220);
  await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await page.clock.runFor(1500);
  await expect(page.locator(root)).toHaveAttribute('data-screen', 'playing');
  const cancelled = await page.locator('canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL());
  expect(cancelled).not.toBe(original);
  await page.clock.runFor(2300);
  await expect(page.locator(root)).toHaveAttribute('data-screen', 'playing');
  expect(await page.locator('canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL())).toBe(cancelled);
  expect((await saved(page)).completedLevelIds).not.toContain('level-05');
  await page.screenshot({ path: info.outputPath('multitouch-cancelled.png') });
  await session.detach();
});

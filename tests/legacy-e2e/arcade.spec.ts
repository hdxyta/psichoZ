import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const captures = resolve('output/playtest/arcade-2026-09-30');
const storageKey = 'psicoz:progress';
const tracks = ['Woodstock', 'Aditivo', 'Silêncio', 'Rumildo', 'Inverso', 'Conhecida Ilusão', 'Não Me Dizem Nada', 'Siblime', 'PsicoZ', 'Psicose feat Nobre', 'Assumindo o Risco', 'Acapella', 'Cidade Cinza', 'Não Posso Errar', 'Faixa 15'];

async function activate(target: Locator, mobile: boolean) { if (mobile) await target.tap(); else await target.click(); }
async function open(page: Page, number: number) {
  await page.goto(`/?preview=arcade-all-tracks#/jogar/track-${String(number).padStart(2, '0')}`);
  const game = page.locator(number === 1 ? '.woodstock-game' : '.arcade-game');
  await expect(game).toHaveAttribute('data-screen', 'ready');
  await expect(game.locator('canvas')).toBeVisible();
  return game;
}
async function start(page: Page, number: number, mobile: boolean) {
  if (number === 1 && !mobile) {
    await page.locator('[data-controls] > summary').click();
    await page.locator('[data-keyboard]').click();
  } else await activate(page.locator('[data-start]'), mobile);
  await expect(page.locator(number === 1 ? '.woodstock-game' : '.arcade-game')).toHaveAttribute('data-screen', 'playing');
}
async function progress(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}') as { completedLevelIds?: string[]; unlockedTrackIds?: string[]; collectibles?: string[] }, storageKey);
}
async function noReward(page: Page) {
  const saved = await progress(page);
  expect(saved.completedLevelIds ?? []).toEqual([]);
  expect(saved.unlockedTrackIds ?? []).toEqual([]);
  expect(saved.collectibles ?? []).toEqual([]);
}
async function capture(page: Page, filename: string) {
  await mkdir(captures, { recursive: true });
  await page.locator('#game-dialog').screenshot({ path: resolve(captures, filename), animations: 'disabled' });
}

for (let index = 0; index < tracks.length; index += 1) {
  const number = index + 1;
  test(`track ${String(number).padStart(2, '0')} opens, starts, pauses and exits without a false reward`, async ({ page, isMobile }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const game = await open(page, number);
    await expect(page.getByRole('dialog')).toHaveAttribute('aria-label', new RegExp(tracks[index]));
    await start(page, number, isMobile);
    await capture(page, `${testInfo.project.name}-track-${String(number).padStart(2, '0')}.png`);
    const dimensions = await game.evaluate((element) => ({ width: element.clientWidth, scroll: element.scrollWidth, viewport: innerWidth }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width + 1);
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
    if (isMobile && number !== 1) {
      const controls = game.locator('button[data-move]:visible, button[data-primary]:visible, .puzzle-controls button:visible');
      for (let i = 0; i < await controls.count(); i += 1) {
        const box = await controls.nth(i).boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThanOrEqual(40);
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
      }
    }
    await activate(page.getByRole('button', { name: 'Pausar partida', exact: true }), isMobile);
    await expect(game).toHaveAttribute('data-screen', 'paused');
    await activate(page.locator(number === 1 ? '[data-exit]' : '[data-menu-exit]'), isMobile);
    await expect(page).toHaveURL(/#jogo$/);
    await expect(page.locator('#game-dialog')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveClass(/game-open/);
    await noReward(page);
    expect(errors).toEqual([]);
  });
}

test('arcade timer freezes during pause, restart resets the board and closing releases the session', async ({ page, isMobile }) => {
  const game = await open(page, 6);
  const time = game.locator('[data-time]');
  const initial = await time.textContent();
  await start(page, 6, isMobile);
  await expect(time).not.toHaveText(initial!);
  await activate(game.locator('[data-pause]'), isMobile);
  const pausedTime = await time.textContent();
  await expect(game.locator('[data-board]')).toHaveAttribute('inert', '');
  await page.waitForTimeout(1250); // Real wall-clock pause check; no game state is changed by the test.
  await expect(time).toHaveText(pausedTime!);
  await expect(game.locator('[data-score]')).toContainText('0 / 6');
  await activate(game.locator('[data-start]'), isMobile);
  await expect(game).toHaveAttribute('data-screen', 'playing');
  await expect(game.locator('[data-board]')).not.toHaveAttribute('inert', '');
  await activate(game.locator('[data-pause]'), isMobile);
  await activate(game.locator('[data-restart]'), isMobile);
  await expect(game).toHaveAttribute('data-screen', 'playing');
  await expect(time).toHaveText(initial!);
  await expect(game.locator('.puzzle-controls [data-state="visible"]')).toHaveCount(12);
  await activate(game.locator('[data-exit]'), isMobile);
  await expect(page.locator('#game-dialog')).toHaveCount(0);
  await noReward(page);
});

test('memory wins using visible preview and real buttons, persists through reload and keeps MP3 pending', async ({ page, isMobile }, testInfo) => {
  const game = await open(page, 6);
  await start(page, 6, isMobile);
  // Read only labels revealed to the player. No hidden model or save state is injected.
  const labels = await game.locator('.puzzle-controls button').evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')!));
  expect(labels).toHaveLength(12);
  const groups = new Map<string, number[]>();
  labels.forEach((label, i) => {
    const symbol = label.split(', ')[1];
    expect(symbol).not.toBe('virada');
    groups.set(symbol, [...(groups.get(symbol) ?? []), i]);
  });
  expect(groups.size).toBe(6);
  await expect(game.locator('[data-puzzle-index="0"]')).toBeEnabled();
  let pair = 0;
  for (const indices of groups.values()) {
    expect(indices).toHaveLength(2);
    for (const index of indices) {
      const cell = game.locator(`[data-puzzle-index="${index}"]`);
      if (!isMobile && pair === 0) { await cell.focus(); await page.keyboard.press('Enter'); }
      else await activate(cell, isMobile);
    }
    pair += 1;
    await expect(game.locator('[data-score]')).toContainText(`${pair} / 6`);
  }
  await expect(game).toHaveAttribute('data-screen', 'won');
  await expect(game.locator('[data-result]')).toContainText('Conquista salva');
  const saved = await progress(page);
  expect(saved.completedLevelIds).toEqual(['level-06']);
  expect(saved.unlockedTrackIds).toEqual(['track-06']);
  expect(saved.collectibles).toEqual(['track-06-recovered']);
  await capture(page, `${testInfo.project.name}-memory-won.png`);
  await activate(game.locator('[data-collection]'), isMobile);
  await expect(page).toHaveURL(/#colecao$/);
  await expect(page.locator('[data-reward-id="track-06-mp3"]')).toContainText('Conquistado no jogo');
  await expect(page.locator('[data-reward-id="track-06-mp3"]')).toContainText('Em breve');
  await expect(page.locator('a[download]')).toHaveCount(0);
  await page.reload();
  expect(await progress(page)).toEqual(saved);
  await expect(page.locator('#game-progress-count')).toHaveText('1 / 15');
});

test('circuit solves through visible switches with click or touch and awards its own track', async ({ page, isMobile }, testInfo) => {
  const game = await open(page, 8);
  await start(page, 8, isMobile);
  const initial = await game.locator('.puzzle-controls button').evaluateAll((buttons) => buttons.map((button) => (button as HTMLElement).dataset.state === 'on'));
  expect(initial).toHaveLength(9);
  let solution: number[] | undefined;
  for (let mask = 0; mask < 512 && !solution; mask += 1) {
    const cells = [...initial];
    const moves: number[] = [];
    for (let i = 0; i < 9; i += 1) if (mask & (1 << i)) {
      moves.push(i);
      for (let j = 0; j < 9; j += 1) if (Math.abs(i % 3 - j % 3) + Math.abs(Math.floor(i / 3) - Math.floor(j / 3)) <= 1) cells[j] = !cells[j];
    }
    if (cells.every(Boolean)) solution = moves;
  }
  expect(solution?.length).toBeGreaterThan(0);
  for (const index of solution!) await activate(game.locator(`[data-puzzle-index="${index}"]`), isMobile);
  await expect(game).toHaveAttribute('data-screen', 'won');
  expect((await progress(page)).completedLevelIds).toEqual(['level-08']);
  expect((await progress(page)).collectibles).toEqual(['track-08-recovered']);
  await capture(page, `${testInfo.project.name}-circuit-won.png`);
});

test('incorrect circuit inputs cause a real loss, retry clears attempts, and no reward is saved', async ({ page, isMobile }) => {
  const game = await open(page, 8);
  await start(page, 8, isMobile);
  for (let i = 0; i < 24; i += 1) await activate(game.locator('[data-puzzle-index="0"]'), isMobile);
  await expect(game).toHaveAttribute('data-screen', 'lost');
  await expect(game.locator('[data-result]')).toContainText('Você perdeu');
  await noReward(page);
  await activate(game.locator('[data-restart]'), isMobile);
  await expect(game).toHaveAttribute('data-screen', 'playing');
  await expect(game.locator('[data-hint]')).toContainText('24 movimentos');
  await noReward(page);
});

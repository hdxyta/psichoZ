import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('Woodstock map supports construction, waves and the real reward', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#/jogar/track-01');
  await page.getByRole('button', { name: 'Jogar', exact: true }).click();
  const game = page.frameLocator('iframe');
  const canvas = game.locator('canvas');
  await expect(canvas).toHaveAttribute('data-map', 'ready');
  await expect(game.locator('.tower-controls [data-build] img')).toHaveCount(4);
  await expect(game.locator('[data-build="orb"]')).toHaveAttribute('aria-disabled', 'true');
  await expect(game.locator('[data-build="portal"]')).toHaveAttribute('aria-disabled', 'true');
  expect(await game.locator('.tower-controls [data-build] img').evaluateAll(images => images.every(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
  expect(await game.locator('canvas').evaluate(() => performance.getEntriesByType('resource').filter(entry => entry.name.includes('/games/tower/minion-')).length)).toBe(5);
  expect(await game.locator('canvas').evaluate(() => performance.getEntriesByType('resource').filter(entry => entry.name.includes('/games/tower/shot-')).length)).toBe(2);
  const bounds = await canvas.boundingBox();
  expect(bounds!.width / bounds!.height).toBeCloseTo(1.5, 1);
  await expect(game.locator('[data-site]')).toHaveCount(12);
  if (testInfo.project.name === 'mobile') {
    await game.locator('[data-site="1"]').tap();
  } else {
    await game.locator('[data-site="1"]').focus();
    await page.keyboard.press('Enter');
  }
  await expect(game.locator('[data-money]')).toHaveText('SINAL 80');
  // Enter builds the focused sigil without accidentally starting a wave.
  await expect(game.locator('[data-game-status]')).toContainText('ONDAS 0 / 5');
  for (const site of [2, 3, 4, 6]) await game.locator(`[data-site="${site}"]`).click();
  await expect(game.locator('[data-money]')).toHaveText('SINAL 0');
  await game.getByRole('button', { name: 'Chamar onda' }).click();
  await expect(game.locator('[data-game-status]')).toContainText('ONDAS 1 / 5');
  await expect(game.locator('[data-game-status]')).toContainText('Somente minions basicos');
  await mkdir('docs/screenshots/woodstock-inferno', { recursive: true });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `docs/screenshots/woodstock-inferno/${testInfo.project.name}.png` });
  // Only regular UI inputs; no position, health or progress injection.
  await expect(page.locator('[data-award]')).toBeVisible({ timeout: 95_000 });
  await expect(page.locator('[data-award]')).toContainText('Conquista salva');
  await expect(game.locator('[data-build="orb"]')).toHaveAttribute('aria-disabled', 'false');
  await expect(game.locator('[data-build="portal"]')).toHaveAttribute('aria-disabled', 'false');
  await page.getByRole('button', { name: 'Fechar jogo' }).click();
  await page.reload();
  await expect(page.locator('[data-game-track="track-01"]')).toHaveAttribute('data-recovered', 'true');
  expect(errors).toEqual([]);
});

test('Woodstock remains playable when the background is missing', async ({ page }, testInfo) => {
  await page.route('**/inferno-map.webp', route => route.abort());
  await page.route('**/inferno-map-animated.svg', route => route.abort());
  await page.goto('/#/jogar/track-01');
  await page.getByRole('button', { name: 'Jogar', exact: true }).click();
  const game = page.frameLocator('iframe');
  await expect(game.locator('canvas')).toHaveAttribute('data-map', 'fallback');
  await expect(game.locator('.map-notice')).toBeVisible();
  await game.locator('[data-site="1"]').click();
  await expect(game.locator('[data-money]')).toHaveText('SINAL 80');
  await game.locator('[data-site="9"]').click();
  await expect(game.locator('[data-money]')).toHaveText('SINAL 35');
  await expect(game.locator('[data-site="9"]')).toHaveAttribute('aria-label', /construir torre/);
  await mkdir('docs/screenshots/woodstock-inferno', { recursive: true });
  await page.screenshot({ path: `docs/screenshots/woodstock-inferno/${testInfo.project.name}-fallback.png` });
});

test('the road reaches the portal and stays visible in landscape', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 851, height: 393 });
  await page.goto('/#/jogar/track-01');
  await page.getByRole('button', { name: 'Jogar', exact: true }).click();
  const game = page.frameLocator('iframe');
  await expect(game.locator('canvas')).toHaveAttribute('data-map', 'ready');
  await game.getByRole('button', { name: 'Chamar onda' }).click();
  await page.waitForTimeout(7000);
  await mkdir('docs/screenshots/woodstock-inferno', { recursive: true });
  await page.screenshot({ path: `docs/screenshots/woodstock-inferno/${testInfo.project.name}-landscape.png` });
  expect(await game.locator('html').evaluate(el => el.scrollWidth <= innerWidth + 1)).toBe(true);
  await expect(game.getByRole('button', { name: 'Chamar onda' })).toBeInViewport();
  // No towers: enemies must traverse all bends and damage the actual portal.
  await expect(game.locator('[data-base]')).toHaveText('TORRE 7', { timeout: 40_000 });
  await expect(page.locator('[data-award]')).toBeHidden();
});

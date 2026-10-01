import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const rootSelector = '.woodstock-game';
const captures = resolve('docs/screenshots/mission-2026-09-21');
const sealIds = ['woodstock-eye', 'woodstock-hand', 'woodstock-chain'];

async function ready(page: Page): Promise<void> {
  await page.goto('/#/jogar/track-01');
  await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'ready');
}

async function start(page: Page, isMobile: boolean): Promise<void> {
  if (!isMobile) {
    await page.locator('details[data-controls] > summary').click();
    await page.locator('[data-keyboard]').click();
  } else await page.locator('[data-start]').tap();
  await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'playing');
}

async function pause(page: Page): Promise<void> {
  await page.keyboard.press('KeyP');
  await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'paused');
}

async function resume(page: Page): Promise<void> {
  await page.locator('[data-start]').click();
  await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'playing');
}

async function expectNoVictory(page: Page): Promise<void> {
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('psicoz:progress') ?? '{}'));
  expect(progress.completedLevelIds ?? []).toEqual([]);
  expect(progress.unlockedTrackIds ?? []).toEqual([]);
  await expect(page.locator('a[download]')).toHaveCount(0);
}

/** Only reads the ordinary map exposed to the player while paused. */
async function pauseMap(page: Page): Promise<{ x: number; z: number; yaw: number }> {
  await pause(page);
  const details = page.locator('.game-map-details');
  if (!(await details.evaluate((element) => (element as HTMLDetailsElement).open))) await details.locator('summary').click();
  const player = page.locator('[data-map-player]');
  await expect(player).toBeVisible();
  const transform = await player.getAttribute('transform');
  const match = /^translate\(([-.\d]+) ([-.\d]+)\) rotate\(([-.\de+]+)\)$/u.exec(transform ?? '');
  expect(match, 'The player-visible map must provide readable position and heading').not.toBeNull();
  return { x: Number(match![1]), z: Number(match![2]), yaw: -Number(match![3]) * Math.PI / 180 };
}

/** Corrects real WASD holds from the visible map, without simulation imports or state injection. */
async function walkTo(page: Page, target: { x: number; z: number }): Promise<void> {
  let position = await pauseMap(page);
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const dx = target.x - position.x;
    const dz = target.z - position.z;
    if (Math.hypot(dx, dz) <= 0.24) { await resume(page); return; }
    const forward = -Math.sin(position.yaw) * dx - Math.cos(position.yaw) * dz;
    const strafe = Math.cos(position.yaw) * dx - Math.sin(position.yaw) * dz;
    const longitudinal = Math.abs(forward) >= Math.abs(strafe);
    const amount = longitudinal ? forward : strafe;
    const key = longitudinal ? amount > 0 ? 'KeyW' : 'KeyS' : amount > 0 ? 'KeyD' : 'KeyA';
    const duration = Math.min(1100, Math.max(45, (Math.abs(amount) - 0.07) / 3.6 * 1000));
    await resume(page);
    await page.keyboard.down(key);
    try { await page.waitForTimeout(duration); } // A real held key; elapsed game time is never injected.
    finally { await page.keyboard.up(key); }
    const next = await pauseMap(page);
    expect(Math.hypot(next.x - position.x, next.z - position.z), `Movement blocked before ${target.x}, ${target.z}`).toBeGreaterThan(0.025);
    position = next;
  }
  throw new Error(`Did not reach ${target.x}, ${target.z} via ordinary player movement.`);
}

test('mission explains the goal, starts with three unrestored seals and offers an initial signal trail', async ({ page, isMobile }, testInfo) => {
  await ready(page);
  await expect(page.locator('[data-mission-title]')).toHaveText('Liberte o sinal');
  await expect(page.locator('[data-seal-id]')).toHaveCount(3);
  for (const id of sealIds) await expect(page.locator(`[data-seal-id="${id}"]`)).toHaveAttribute('data-restored', 'false');
  await expect(page.locator('[data-objective]')).toHaveText('Revele o sinal');
  await mkdir(captures, { recursive: true });
  await page.screenshot({ path: resolve(captures, `briefing-${testInfo.project.name}.png`), scale: 'css', animations: 'disabled' });
  await start(page, isMobile);
  await expect(page.locator(rootSelector)).toHaveAttribute('data-scanning', 'true');
  await expect(page.locator('[data-navigation]')).not.toHaveText('');
  await expect(page.locator('[data-threat]')).toHaveAttribute('data-awareness', 'patrolling');
  await expect(page.getByRole('button', { name: 'Rastrear sinal', exact: true })).toBeVisible();
  await page.screenshot({ path: resolve(captures, `initial-trail-${testInfo.project.name}.png`), scale: 'css', animations: 'disabled' });
  await expectNoVictory(page);
});

test('signal tracking uses active play time, respects its cooldown and resets with the run', async ({ page, isMobile }) => {
  test.setTimeout(45000);
  await ready(page);
  await start(page, isMobile);
  const root = page.locator(rootSelector);
  const scan = page.getByRole('button', { name: 'Rastrear sinal', exact: true });
  const label = page.locator('[data-scan-label]');
  await expect(root).toHaveAttribute('data-scanning', 'false', { timeout: 12000 });
  await expect(scan).toBeEnabled();
  if (isMobile) await scan.tap();
  else await page.keyboard.press('KeyQ');
  await expect(root).toHaveAttribute('data-scanning', 'true');
  await expect(label).toContainText('Rastreando');
  await pause(page);
  // Longer than the whole trail lifetime: wall-clock time while paused must not consume it.
  await page.waitForTimeout(6300);
  await page.keyboard.press('KeyQ'); // A paused key must not trigger or refresh a scan.
  await resume(page);
  await expect(root).toHaveAttribute('data-scanning', 'true');
  await page.waitForTimeout(1000);
  await expect(root).toHaveAttribute('data-scanning', 'true');
  await expect(root).toHaveAttribute('data-scanning', 'false', { timeout: 9000 });
  await expect(label).toContainText('Recarga');
  await expect(scan).toBeDisabled();
  await page.keyboard.press('KeyQ');
  await expect(root).toHaveAttribute('data-scanning', 'false');
  await expect(scan).toBeEnabled({ timeout: 5000 });
  await expect(label).toContainText('Rastrear');
  await page.keyboard.press('KeyQ');
  await expect(root).toHaveAttribute('data-scanning', 'true');
  await pause(page);
  await page.getByRole('button', { name: 'Recomeçar fase', exact: true }).click();
  await expect(root).toHaveAttribute('data-screen', 'ready');
  await expect(root).toHaveAttribute('data-scanning', 'false');
  await expect(page.locator('[data-symbol-count]')).toHaveText('0 / 3');
  for (const id of sealIds) await expect(page.locator(`[data-seal-id="${id}"]`)).toHaveAttribute('data-restored', 'false');
  await expectNoVictory(page);
});

test('walking to and restoring the first seal advances the objective and restores the trail without awarding victory', async ({ page, isMobile }, testInfo) => {
  test.setTimeout(45000);
  await ready(page);
  await start(page, isMobile);
  for (const [x, z] of [[0, 10], [-4, 10], [-4, 5.5], [-9, 4]]) await walkTo(page, { x, z });
  await expect(page.locator('[data-symbol-count]')).toHaveText('0 / 3');
  await expect(page.locator(rootSelector)).toHaveAttribute('data-scanning', 'false');
  await expect(page.locator('[data-prompt]')).toContainText(/restaurar|recolher/u);
  if (isMobile) await page.getByRole('button', { name: 'Interagir', exact: true }).tap();
  else await page.keyboard.press('KeyE');
  await expect(page.locator('[data-symbol-count]')).toHaveText('1 / 3');
  const eye = page.locator('[data-seal-id="woodstock-eye"]');
  await expect(eye).toHaveAttribute('data-restored', 'true');
  await expect(eye).toHaveAttribute('aria-label', /restaurad/u);
  await expect(page.locator('[data-seal-id="woodstock-hand"]')).toHaveAttribute('data-restored', 'false');
  await expect(page.locator('[data-seal-id="woodstock-chain"]')).toHaveAttribute('data-restored', 'false');
  await expect(page.locator('[data-objective]')).toHaveText('Recupere a força');
  await expect(page.locator(rootSelector)).toHaveAttribute('data-scanning', 'true');
  await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'playing');
  await expect(page.locator('[data-health]')).toHaveText('100');
  await expectNoVictory(page);
  await mkdir(captures, { recursive: true });
  await page.screenshot({ path: resolve(captures, `first-seal-${testInfo.project.name}.png`), scale: 'css', animations: 'disabled' });
});

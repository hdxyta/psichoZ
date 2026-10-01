# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mission.spec.ts >> mission explains the goal, starts with three unrestored seals and offers an initial signal trail
- Location: tests\e2e\mission.spec.ts:76:1

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('[data-mission-title]')
Expected: "Liberte o sinal"
Received: "Liberte o sinal."
Timeout:  5000ms

Call log:
  - Expect "toHaveText" locator('[data-mission-title]') with timeout 5000ms
  - waiting for locator('[data-mission-title]')
    14 × locator resolved to <strong data-mission-title="" class="game-mission-title">Liberte o sinal.</strong>
       - unexpected value "Liberte o sinal."

```

```yaml
- strong: Liberte o sinal.
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | import { mkdir } from 'node:fs/promises';
  3   | import { resolve } from 'node:path';
  4   | 
  5   | const rootSelector = '.woodstock-game';
  6   | const captures = resolve('docs/screenshots/mission-2026-09-21');
  7   | const sealIds = ['woodstock-eye', 'woodstock-hand', 'woodstock-chain'];
  8   | 
  9   | async function ready(page: Page): Promise<void> {
  10  |   await page.goto('/#/jogar/track-01');
  11  |   await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'ready');
  12  | }
  13  | 
  14  | async function start(page: Page, isMobile: boolean): Promise<void> {
  15  |   if (!isMobile) {
  16  |     await page.locator('details[data-controls] > summary').click();
  17  |     await page.locator('[data-keyboard]').click();
  18  |   } else await page.locator('[data-start]').tap();
  19  |   await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'playing');
  20  | }
  21  | 
  22  | async function pause(page: Page): Promise<void> {
  23  |   await page.keyboard.press('KeyP');
  24  |   await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'paused');
  25  | }
  26  | 
  27  | async function resume(page: Page): Promise<void> {
  28  |   await page.locator('[data-start]').click();
  29  |   await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'playing');
  30  | }
  31  | 
  32  | async function expectNoVictory(page: Page): Promise<void> {
  33  |   const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('psicoz:progress') ?? '{}'));
  34  |   expect(progress.completedLevelIds ?? []).toEqual([]);
  35  |   expect(progress.unlockedTrackIds ?? []).toEqual([]);
  36  |   await expect(page.locator('a[download]')).toHaveCount(0);
  37  | }
  38  | 
  39  | /** Only reads the ordinary map exposed to the player while paused. */
  40  | async function pauseMap(page: Page): Promise<{ x: number; z: number; yaw: number }> {
  41  |   await pause(page);
  42  |   const details = page.locator('.game-map-details');
  43  |   if (!(await details.evaluate((element) => (element as HTMLDetailsElement).open))) await details.locator('summary').click();
  44  |   const player = page.locator('[data-map-player]');
  45  |   await expect(player).toBeVisible();
  46  |   const transform = await player.getAttribute('transform');
  47  |   const match = /^translate\(([-.\d]+) ([-.\d]+)\) rotate\(([-.\de+]+)\)$/u.exec(transform ?? '');
  48  |   expect(match, 'The player-visible map must provide readable position and heading').not.toBeNull();
  49  |   return { x: Number(match![1]), z: Number(match![2]), yaw: -Number(match![3]) * Math.PI / 180 };
  50  | }
  51  | 
  52  | /** Corrects real WASD holds from the visible map, without simulation imports or state injection. */
  53  | async function walkTo(page: Page, target: { x: number; z: number }): Promise<void> {
  54  |   let position = await pauseMap(page);
  55  |   for (let attempt = 0; attempt < 24; attempt += 1) {
  56  |     const dx = target.x - position.x;
  57  |     const dz = target.z - position.z;
  58  |     if (Math.hypot(dx, dz) <= 0.24) { await resume(page); return; }
  59  |     const forward = -Math.sin(position.yaw) * dx - Math.cos(position.yaw) * dz;
  60  |     const strafe = Math.cos(position.yaw) * dx - Math.sin(position.yaw) * dz;
  61  |     const longitudinal = Math.abs(forward) >= Math.abs(strafe);
  62  |     const amount = longitudinal ? forward : strafe;
  63  |     const key = longitudinal ? amount > 0 ? 'KeyW' : 'KeyS' : amount > 0 ? 'KeyD' : 'KeyA';
  64  |     const duration = Math.min(1100, Math.max(45, (Math.abs(amount) - 0.07) / 3.6 * 1000));
  65  |     await resume(page);
  66  |     await page.keyboard.down(key);
  67  |     try { await page.waitForTimeout(duration); } // A real held key; elapsed game time is never injected.
  68  |     finally { await page.keyboard.up(key); }
  69  |     const next = await pauseMap(page);
  70  |     expect(Math.hypot(next.x - position.x, next.z - position.z), `Movement blocked before ${target.x}, ${target.z}`).toBeGreaterThan(0.025);
  71  |     position = next;
  72  |   }
  73  |   throw new Error(`Did not reach ${target.x}, ${target.z} via ordinary player movement.`);
  74  | }
  75  | 
  76  | test('mission explains the goal, starts with three unrestored seals and offers an initial signal trail', async ({ page, isMobile }, testInfo) => {
  77  |   await ready(page);
> 78  |   await expect(page.locator('[data-mission-title]')).toHaveText('Liberte o sinal');
      |                                                      ^ Error: expect(locator).toHaveText(expected) failed
  79  |   await expect(page.locator('[data-seal-id]')).toHaveCount(3);
  80  |   for (const id of sealIds) await expect(page.locator(`[data-seal-id="${id}"]`)).toHaveAttribute('data-restored', 'false');
  81  |   await expect(page.locator('[data-objective]')).toHaveText('Revele o sinal');
  82  |   await mkdir(captures, { recursive: true });
  83  |   await page.screenshot({ path: resolve(captures, `briefing-${testInfo.project.name}.png`), scale: 'css', animations: 'disabled' });
  84  |   await start(page, isMobile);
  85  |   await expect(page.locator(rootSelector)).toHaveAttribute('data-scanning', 'true');
  86  |   await expect(page.locator('[data-navigation]')).not.toHaveText('');
  87  |   await expect(page.locator('[data-threat]')).toHaveAttribute('data-awareness', 'patrolling');
  88  |   await expect(page.getByRole('button', { name: 'Rastrear sinal', exact: true })).toBeVisible();
  89  |   await page.screenshot({ path: resolve(captures, `initial-trail-${testInfo.project.name}.png`), scale: 'css', animations: 'disabled' });
  90  |   await expectNoVictory(page);
  91  | });
  92  | 
  93  | test('signal tracking uses active play time, respects its cooldown and resets with the run', async ({ page, isMobile }) => {
  94  |   test.setTimeout(45000);
  95  |   await ready(page);
  96  |   await start(page, isMobile);
  97  |   const root = page.locator(rootSelector);
  98  |   const scan = page.getByRole('button', { name: 'Rastrear sinal', exact: true });
  99  |   const label = page.locator('[data-scan-label]');
  100 |   await expect(root).toHaveAttribute('data-scanning', 'false', { timeout: 12000 });
  101 |   await expect(scan).toBeEnabled();
  102 |   if (isMobile) await scan.tap();
  103 |   else await page.keyboard.press('KeyQ');
  104 |   await expect(root).toHaveAttribute('data-scanning', 'true');
  105 |   await expect(label).toContainText('Rastreando');
  106 |   await pause(page);
  107 |   // Longer than the whole trail lifetime: wall-clock time while paused must not consume it.
  108 |   await page.waitForTimeout(6300);
  109 |   await page.keyboard.press('KeyQ'); // A paused key must not trigger or refresh a scan.
  110 |   await resume(page);
  111 |   await expect(root).toHaveAttribute('data-scanning', 'true');
  112 |   await page.waitForTimeout(1000);
  113 |   await expect(root).toHaveAttribute('data-scanning', 'true');
  114 |   await expect(root).toHaveAttribute('data-scanning', 'false', { timeout: 9000 });
  115 |   await expect(label).toContainText('Recarga');
  116 |   await expect(scan).toBeDisabled();
  117 |   await page.keyboard.press('KeyQ');
  118 |   await expect(root).toHaveAttribute('data-scanning', 'false');
  119 |   await expect(scan).toBeEnabled({ timeout: 5000 });
  120 |   await expect(label).toContainText('Rastrear');
  121 |   await page.keyboard.press('KeyQ');
  122 |   await expect(root).toHaveAttribute('data-scanning', 'true');
  123 |   await pause(page);
  124 |   await page.getByRole('button', { name: 'Recomeçar fase', exact: true }).click();
  125 |   await expect(root).toHaveAttribute('data-screen', 'ready');
  126 |   await expect(root).toHaveAttribute('data-scanning', 'false');
  127 |   await expect(page.locator('[data-symbol-count]')).toHaveText('0 / 3');
  128 |   for (const id of sealIds) await expect(page.locator(`[data-seal-id="${id}"]`)).toHaveAttribute('data-restored', 'false');
  129 |   await expectNoVictory(page);
  130 | });
  131 | 
  132 | test('walking to and restoring the first seal advances the objective and restores the trail without awarding victory', async ({ page, isMobile }, testInfo) => {
  133 |   test.setTimeout(45000);
  134 |   await ready(page);
  135 |   await start(page, isMobile);
  136 |   for (const [x, z] of [[0, 10], [-4, 10], [-4, 5.5], [-9, 4]]) await walkTo(page, { x, z });
  137 |   await expect(page.locator('[data-symbol-count]')).toHaveText('0 / 3');
  138 |   await expect(page.locator(rootSelector)).toHaveAttribute('data-scanning', 'false');
  139 |   await expect(page.locator('[data-prompt]')).toContainText(/restaurar|recolher/u);
  140 |   if (isMobile) await page.getByRole('button', { name: 'Interagir', exact: true }).tap();
  141 |   else await page.keyboard.press('KeyE');
  142 |   await expect(page.locator('[data-symbol-count]')).toHaveText('1 / 3');
  143 |   const eye = page.locator('[data-seal-id="woodstock-eye"]');
  144 |   await expect(eye).toHaveAttribute('data-restored', 'true');
  145 |   await expect(eye).toHaveAttribute('aria-label', /restaurad/u);
  146 |   await expect(page.locator('[data-seal-id="woodstock-hand"]')).toHaveAttribute('data-restored', 'false');
  147 |   await expect(page.locator('[data-seal-id="woodstock-chain"]')).toHaveAttribute('data-restored', 'false');
  148 |   await expect(page.locator('[data-objective]')).toHaveText('Recupere a força');
  149 |   await expect(page.locator(rootSelector)).toHaveAttribute('data-scanning', 'true');
  150 |   await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'playing');
  151 |   await expect(page.locator('[data-health]')).toHaveText('100');
  152 |   await expectNoVictory(page);
  153 |   await mkdir(captures, { recursive: true });
  154 |   await page.screenshot({ path: resolve(captures, `first-seal-${testInfo.project.name}.png`), scale: 'css', animations: 'disabled' });
  155 | });
  156 | 
```
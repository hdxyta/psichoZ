import { chromium, devices, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const folder = resolve('docs/screenshots/vendor-puzzles-2026-09-30');
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext(mobile ? { ...devices['Pixel 7'] } : { viewport: { width: 900, height: 850 } });
    // All independent puzzle storage must have been removed: only the parent owns progress.
    await context.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Standalone storage forbidden in this test'); } }));
    for (const slug of ['memory', 'minesweeper', 'sokoban', '2048']) {
      const page = await context.newPage(); const errors = [], external = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4174/')) external.push(request.url()); });
      await page.goto(`http://127.0.0.1:4174/games/${slug}/index.html`);
      await expect(page.locator('h1')).toBeVisible();
      if (slug === 'memory') {
        await expect(page.locator('.card')).toHaveCount(12);
        await page.screenshot({ path: resolve(folder, `${slug}-${mobile ? 'mobile' : 'desktop'}.png`) });
        const pairs = await page.locator('.card').evaluateAll(cards => {
          const groups = {};
          for (const card of cards) { const face = card.querySelector('.back').textContent; (groups[face] ??= []).push(card.dataset.cardIndex); }
          return Object.values(groups);
        });
        for (const pair of pairs) {
          for (const index of pair) await page.locator(`[data-card-index="${index}"]`).click();
          await expect(page.locator(`[data-card-index="${pair[0]}"]`)).toHaveCount(0);
        }
        await expect(page.locator('#result')).toContainText('Faixa recuperada');
      } else if (slug === 'sokoban') {
        await page.screenshot({ path: resolve(folder, `${slug}-${mobile ? 'mobile' : 'desktop'}.png`) });
        const path = ['right','right','down','right','down','down','left','left','down','right','right','up','up','up','left','left','up','left','down','down','up','right','right','down'];
        for (const direction of path) {
          if (mobile) await page.locator(`[data-direction="${direction}"]`).tap();
          else await page.keyboard.press({ up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[direction]);
        }
        await expect(page.locator('#status')).toHaveText('3 / 3 caixas · Faixa recuperada');
      } else if (slug === 'minesweeper') {
        await expect(page.locator('.ms-cell')).toHaveCount(64);
        if (mobile) await page.locator('.ms-cell').first().tap(); else await page.locator('.ms-cell').first().click();
        await expect(page.locator('.mine')).toHaveCount(0);
        expect(await page.locator('.revealed').count()).toBeGreaterThan(0);
        await page.locator('#flag-mode').click();
        await page.locator('.ms-cell:not(.revealed)').first().click();
        await expect(page.locator('.flagged')).toHaveCount(1);
        await page.screenshot({ path: resolve(folder, `${slug}-${mobile ? 'mobile' : 'desktop'}.png`) });
      } else {
        await expect(page.locator('.tile')).toHaveCount(2);
        if (mobile) await page.locator('[data-move="2"]').tap(); else await page.keyboard.press('ArrowDown');
        await expect.poll(() => page.locator('.tile').count()).toBeGreaterThanOrEqual(2);
        await page.screenshot({ path: resolve(folder, `${slug}-${mobile ? 'mobile' : 'desktop'}.png`) });
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]); expect(external).toEqual([]);
      results.push(`${slug}/${mobile ? 'mobile' : 'desktop'}: OK`);
      await page.close();
    }
    await context.close();
  }
  console.log(results.join('\n'));
} finally { await browser.close(); }

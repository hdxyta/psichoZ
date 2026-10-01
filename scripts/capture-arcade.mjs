// Local visual QA only: isolated Chrome, localhost, screenshots and runtime/network observations.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const dir = 'docs/screenshots/arcade-2026-09-30';
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];
try {
  for (const profile of [
    { name: 'desktop', viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false },
    { name: 'mobile', viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true },
    { name: 'landscape', viewport: { width: 851, height: 393 }, isMobile: true, hasTouch: true },
  ]) {
    const { name, ...options } = profile;
    const context = await browser.newContext({ ...options, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await context.newPage(); const errors = []; const requests = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (r.resourceType() === 'script') requests.push(r.url()); });
    await page.goto('http://127.0.0.1:4173/#jogo');
    await page.locator('#game-grid').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${dir}/${name}-hub.png` });
    const initialScripts = [...requests];
    for (const id of ['02', '03', '04', '05', '06', '07', '08', '10', '12', '13', '14', '15']) {
      await page.goto(`http://127.0.0.1:4173/#/jogar/track-${id}`);
      await page.locator('.arcade-game[data-screen="ready"]').waitFor();
      await page.getByRole('button', { name: 'Jogar', exact: true }).click();
      await page.locator('.arcade-game[data-screen="playing"]').waitFor();
      await page.waitForTimeout(350);
      await page.screenshot({ path: `${dir}/${name}-track-${id}.png` });
      report.push({ profile: name, track: id, layout: await page.evaluate(() => {
        const canvas = document.querySelector('.arcade-stage canvas').getBoundingClientRect();
        return { viewport: [innerWidth, innerHeight], canvas: { x: canvas.x, y: canvas.y, width: canvas.width, height: canvas.height }, overflow: document.documentElement.scrollWidth > innerWidth };
      }) });
    }
    report.push({ profile: name, errors, initialScripts, requestedScripts: [...new Set(requests)] });
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(`${dir}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.filter(x => x.errors || x.layout.overflow), null, 2));

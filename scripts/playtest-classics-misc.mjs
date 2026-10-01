import { chromium, devices } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
await mkdir('output/playtest/classics-misc', { recursive: true });
for (const [profile, options] of [['desktop', { viewport: { width: 1200, height: 850 } }], ['mobile', { ...devices['Pixel 7'] }]]) {
  const context = await browser.newContext(options);
  for (const [slug, track] of [['maze','01'],['flappy','03'],['asteroids','09'],['invaders','12'],['simon','14']]) {
    const page = await context.newPage(), errors = [], remote = [];
    page.on('pageerror', error => { errors.push(error.message); console.log(slug, error.message); });
    page.on('request', req => { if (!req.url().startsWith('http://127.0.0.1:4174') && !req.url().startsWith('data:')) remote.push(req.url()); });
    await page.goto(`http://127.0.0.1:4174/#/jogar/track-${track}`);
    await page.locator('.vendor-game[data-screen="ready"]').waitFor();
    await page.locator('[data-start]').click();
    await page.locator('.vendor-game[data-screen="playing"]').waitFor({ timeout: 6000 }).catch(async () => { errors.push('Failed to start: ' + await page.locator('.vendor-game').getAttribute('data-screen')); });
    await page.waitForTimeout(550);
    await page.screenshot({ path: `output/playtest/classics-misc/${profile}-${slug}.png` });
    const frame = page.frames().find(frame => frame.url().includes(`/games/${slug}/`));
    const bounds = await frame.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth, height: innerHeight, bodyScroll: document.body.scrollHeight }));
    results.push({ profile, slug, errors, remote, bounds });
    if (await page.locator('[data-pause]').isEnabled()) { await page.locator('[data-pause]').click(); await page.locator('.vendor-game[data-screen="paused"]').waitFor(); }
    await page.close();
  }
  await context.close();
}
await browser.close();
await writeFile('output/playtest/classics-misc/results.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
if(results.some(row=>row.errors.length || row.remote.length || row.bounds.scroll > row.bounds.width)) process.exitCode=1;

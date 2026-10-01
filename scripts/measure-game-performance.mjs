// Local-only lab audit. Browser instrumentation exists in the isolated test context, not the app.
import { chromium, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const runId = new Date().toISOString().replace(/[:.]/gu, '-');
const screenshotFolder = `docs/screenshots/woodstock-performance/${runId}`;
const baselineFolder = `docs/baselines/woodstock-performance/${runId}`;
const resultPath = 'docs/performance-woodstock-results.json';

async function enterGame(page) {
  const game = page.locator('.woodstock-game');
  await page.locator('[data-start]').click();
  await page.locator('.woodstock-game[data-screen="playing"], .game-mouse-fallback:not([hidden])').waitFor({ state: 'visible' });
  let fallbackReason = null;
  if (await game.getAttribute('data-screen') !== 'playing') {
    fallbackReason = await page.locator('.game-mouse-fallback [role="status"]').textContent();
    const controls = page.locator('details[data-controls]');
    if (!(await controls.evaluate((element) => element.open))) await controls.locator('summary').click();
    await controls.getByRole('button', { name: 'Jogar só com teclado', exact: true }).click();
  }
  await expect(game).toHaveAttribute('data-screen', 'playing');
  const mode = await game.getAttribute('data-controls');
  const pointerLockConfirmed = await page.evaluate(() => document.pointerLockElement === document.querySelector('.game-world canvas'));
  if (mode === 'mouse' && !pointerLockConfirmed) throw new Error('Mouse mode started without confirmed native pointer lock.');
  return { mode, pointerLockConfirmed, fallbackReason };
}

async function pauseGame(page) {
  // A captured mouse cannot click DOM menus until it is released; P is a player action.
  await page.keyboard.press('p');
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'paused');
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = { date: new Date().toISOString(), browser: browser.version(), node: process.version,
  conditions: 'Local production preview, isolated Chrome, cold cache, no network/CPU throttling. Desktop tries native mouse capture; any keyboard fallback is recorded. Mobile is emulated. Frame intervals are a stationary laboratory sample, not physical-device FPS.',
  screenshotFolder, previousResultBaseline: null, profiles: [] };
try {
  await mkdir(screenshotFolder, { recursive: true });
  for (const profile of [
    { name: 'desktop', viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    { name: 'mobile-emulated', viewport: { width: 393, height: 851 }, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true },
  ]) {
    const { name, ...settings } = profile;
    const context = await browser.newContext(settings);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await page.addInitScript(() => {
      window.__gameLab = { draws: 0 };
      for (const method of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
        const original = WebGL2RenderingContext.prototype[method];
        WebGL2RenderingContext.prototype[method] = function (...args) { window.__gameLab.draws++; return original.apply(this, args); };
      }
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('http://127.0.0.1:4173/');
    await page.evaluate(() => document.fonts.ready);
    const opening = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => ({ url: entry.name, bytes: entry.transferSize, type: entry.initiatorType })));
    if (opening.some(({ url }) => /runtime-|\/audio\//.test(url))) throw new Error('The home loaded a game/audio resource.');
    const start = Date.now();
    await page.locator('#tracklist a[href="#/jogar/track-01"]').click();
    await page.locator('.woodstock-game[data-screen="ready"]').waitFor();
    const readyMs = Date.now() - start;
    const controls = await enterGame(page);
    await page.waitForTimeout(600);
    const sample = await page.evaluate(() => new Promise((resolve) => {
      const intervals = []; const calls = []; let last = performance.now(); const startTime = last; let lastDraws = window.__gameLab.draws;
      function sampleFrame(now) {
        const count = window.__gameLab.draws;
        intervals.push(now - last); calls.push(count - lastDraws); last = now; lastDraws = count;
        if (now - startTime < 3500) { requestAnimationFrame(sampleFrame); return; }
        const sorted = intervals.slice(1).sort((a, b) => a - b);
        const gl = document.querySelector('.game-world canvas').getContext('webgl2');
        const canvas = document.querySelector('.game-world canvas');
        resolve({ milliseconds: now - startTime, frames: intervals.length, estimatedFps: (intervals.length - 1) / (sorted.reduce((a, b) => a + b, 0) / 1000),
          medianIntervalMs: sorted[Math.floor(sorted.length / 2)], p95IntervalMs: sorted[Math.floor(sorted.length * .95)],
          maxDrawCallsPerFrame: Math.max(...calls.slice(1)), internalResolution: [canvas.width, canvas.height], renderer: gl.getParameter(gl.RENDERER) });
      }
      requestAnimationFrame(sampleFrame);
    }));
    await page.screenshot({ path: `${screenshotFolder}/world-${name}.png` });
    const resources = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => ({ url: entry.name, bytes: entry.transferSize, type: entry.initiatorType })));
    if (resources.some(({ url }) => /\/audio\//.test(url))) throw new Error('Silent start requested audio.');
    await pauseGame(page);
    await page.getByLabel('Ativar áudio de teste').check();
    const audioResponse = page.waitForResponse((response) => response.url().endsWith('/audio/woodstock-demo-v1.wav'));
    const resumedControls = await enterGame(page);
    const audio = await audioResponse;
    await pauseGame(page);
    await page.getByRole('button', { name: 'Voltar à home' }).click();
    await page.locator('#game-dialog').waitFor({ state: 'detached' });
    results.profiles.push({ name, readyMs, controls, resumedControls, opening, resources,
      gameChunkAndCssBytes: resources.filter(({ url }) => /runtime-/.test(url)).reduce((total, entry) => total + entry.bytes, 0),
      allResourcesAtPlayBytes: resources.reduce((total, entry) => total + entry.bytes, 0), sample, audioStatus: audio.status(),
      canvasCountAfterExit: await page.locator('canvas').count(), errors });
    await context.close();
  }
  const html = await readFile('dist/index.html');
  results.htmlSha256 = createHash('sha256').update(html).digest('hex');
  const previous = await readFile(resultPath).catch((error) => { if (error.code === 'ENOENT') return null; throw error; });
  if (previous) {
    await mkdir(baselineFolder, { recursive: true });
    results.previousResultBaseline = `${baselineFolder}/performance-woodstock-results.json`;
    await writeFile(results.previousResultBaseline, previous, { flag: 'wx' });
  }
  await writeFile(resultPath, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results.profiles.map(({ name, readyMs, controls, resumedControls, gameChunkAndCssBytes, allResourcesAtPlayBytes, sample, audioStatus, canvasCountAfterExit, errors }) => ({ name, readyMs, controls, resumedControls, gameChunkAndCssBytes, allResourcesAtPlayBytes, sample, audioStatus, canvasCountAfterExit, errors })), null, 2));
  if (results.profiles.some((profile) => profile.errors.length)) process.exitCode = 1;
} finally { await browser.close(); }

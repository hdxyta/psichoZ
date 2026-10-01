/**
 * Real, local game thumbnails for the combined album tracklist.
 * Usage: node scripts/capture-game-thumbnails.mjs [slug ...]
 * PSICOZ_GAMES_URL defaults to the local production preview on port 4173.
 * Starts isolated Chrome, plays through ordinary input, freezes its clock and
 * screenshots the actual board/canvas. No drawing, image editing or game-state
 * injection. CSS sizing/framing applies only to this disposable capture context.
 * Random upstream boards remain random; this reproduces the capture procedure,
 * not a seeded replacement for the games. Source licenses remain beside games.
 */
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const origin = process.env.PSICOZ_GAMES_URL ?? 'http://127.0.0.1:4173';
const output = resolve('public/assets/game-thumbs');
const manifestPath = resolve('docs/game-thumbnails.json');
const catalog = await readFile('src/data/vendor-games.ts', 'utf8');
const games = [...catalog.matchAll(/trackId:'([^']+)',slug:'([^']+)'[\s\S]*?repository:'([^']+)'/g)]
  .map(([, trackId, slug, repository]) => ({ trackId, slug, repository }));
if (games.length !== 15) throw new Error(`Expected 15 existing catalog games; found ${games.length}`);
const requested = process.argv.slice(2);
for (const slug of requested) if (!games.some(game => game.slug === slug)) throw new Error(`Unknown game: ${slug}`);
const selectors = { memory: '#cards', minesweeper: '#grid', simon: '.simon-board', '2048': '.game-container' };
const initialTime = new Date('2026-09-30T12:00:00Z');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome', headless: true });
let previous = [];
if (requested.length) {
  try { previous = JSON.parse(await readFile(manifestPath, 'utf8')).games; } catch { /* First partial capture. */ }
}
const results = [];

function jpegDimensions(data) {
  for (let position = 2; position < data.length;) {
    const marker = data[position + 1], length = data.readUInt16BE(position + 2);
    if ([0xc0, 0xc1, 0xc2].includes(marker)) return { width: data.readUInt16BE(position + 7), height: data.readUInt16BE(position + 5) };
    position += length + 2;
  }
  throw new Error('Screenshot did not contain a JPEG frame header');
}

async function advance(page, milliseconds) { await page.clock.runFor(milliseconds); }
async function press(page, key, milliseconds = 32) { await page.keyboard.press(key); await advance(page, milliseconds); }

async function snakePreview(page) {
  let direction = [1, 0];
  for (let turn = 0; turn < 150; turn++) {
    const enoughFood = /GOTAS [3-6] \/ 6/.test(await page.locator('[data-game-status]').textContent());
    // Read rendered cells only. Play to three food pickups so the silhouette is a snake.
    const grid = await page.locator('canvas').evaluate(canvas => {
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      const color = (x, y) => [...pixels.slice((y * canvas.width + x) * 4, (y * canvas.width + x) * 4 + 3)];
      const red = pixel => pixel[0] > 230 && pixel[1] < 80 && pixel[2] < 100;
      let head = [], food = []; const body = [];
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const center = color(x * 24 + 12, y * 24 + 12);
        if (red(center)) { if (red(color(x * 24 + 3, y * 24 + 3))) head = [x, y]; else food = [x, y]; }
        else if (center.every(value => value < 20)) body.push(`${x},${y}`);
      }
      return { head, food, body };
    });
    if (grid.head.length !== 2 || grid.food.length !== 2) throw new Error('Snake board is not in a playable state');
    const target = enoughFood ? [8, 8] : grid.food;
    if (enoughFood && grid.head.join(',') === target.join(',')) {
      // Finish a genuine turn near the center instead of photographing a clipped edge.
      const turn = [[-direction[1], direction[0]], [direction[1], -direction[0]]].find(move =>
        [1, 2].every(step => !grid.body.includes(`${grid.head[0] + move[0] * step},${grid.head[1] + move[1] * step}`)));
      if (turn) for (let step = 0; step < 2; step++) await press(page, turn[0] > 0 ? 'ArrowRight' : turn[0] < 0 ? 'ArrowLeft' : turn[1] > 0 ? 'ArrowDown' : 'ArrowUp');
      return;
    }
    const queue = [{ position: grid.head, first: null }], seen = new Set(grid.body); seen.add(grid.head.join(','));
    let next;
    while (queue.length) {
      const item = queue.shift();
      if (item.position.join(',') === target.join(',')) { next = item.first; break; }
      for (const move of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        if (!item.first && move[0] === -direction[0] && move[1] === -direction[1]) continue;
        const position = [(item.position[0] + move[0] + 16) % 16, (item.position[1] + move[1] + 16) % 16];
        if (seen.has(position.join(','))) continue;
        seen.add(position.join(',')); queue.push({ position, first: item.first ?? move });
      }
    }
    if (!next) throw new Error('No route to food in Snake capture');
    direction = next;
    await press(page, next[0] > 0 ? 'ArrowRight' : next[0] < 0 ? 'ArrowLeft' : next[1] > 0 ? 'ArrowDown' : 'ArrowUp');
  }
  throw new Error('Snake preview did not reach three food items');
}

async function prepare(page, slug) {
  await advance(page, 96);
  if (slug === 'snake') await snakePreview(page);
  else if (slug === 'tetris') {
    for (const [column, turns] of [[0, 1], [7, 0], [3, 1], [5, 0], [1, 1], [7, 1], [4, 0], [0, 0], [6, 1], [3, 0], [1, 1], [7, 0]]) {
      for (let n = 0; n < turns; n++) await press(page, 'ArrowUp');
      const currentX = await page.evaluate(() => current.x);
      for (let n = 0; n < Math.abs(column - currentX); n++) await press(page, column < currentX ? 'ArrowLeft' : 'ArrowRight');
      await page.locator('#drop').click(); await advance(page, 32);
      if (!(await page.evaluate(() => playing))) throw new Error('Tetris capture reached a terminal screen');
    }
    await advance(page, 400);
  } else if (slug === 'memory') {
    const cards = await page.locator('.card').evaluateAll(items => items.map(card => ({ index: card.dataset.cardIndex, symbol: card.querySelector('.back').textContent })));
    const first = cards[2], second = cards.find(card => card.symbol !== first.symbol && Number(card.index) > 5);
    await page.locator(`[data-card-index="${first.index}"]`).click();
    await page.locator(`[data-card-index="${second.index}"]`).click();
    await advance(page, 250);
  } else if (slug === 'riskcards') {
    await page.locator('[data-lane="0"]').click();
    await advance(page, 80);
    await page.locator('[data-lane="1"]').click();
    await advance(page, 80);
  } else if (slug === 'minesweeper') {
    await page.locator('.ms-cell').nth(27).click(); await advance(page, 32);
    await page.locator('#flag-mode').click();
    await page.locator('.ms-cell:not(.revealed)').first().click();
    await advance(page, 32);
  } else if (slug === '2048') {
    for (const key of ['ArrowDown', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowLeft']) await press(page, key, 140);
  } else if (slug === 'flappy') {
    // Normal flight input. Keep the eye at gap height while the first gates enter view.
    for (let n = 0; n < 70; n++) {
      const flight = await page.evaluate(() => ({ y: bY, score, gate: pipe.find(item => item.x + pipeNorth.width > bX)?.y ?? 0 }));
      if (flight.score >= 1) break;
      if (flight.y > flight.gate + 315) await page.keyboard.press('Space');
      await advance(page, 120);
    }
    if (await page.evaluate(() => gameOver)) throw new Error('Flappy capture reached defeat');
  } else if (slug === 'brawler') {
    await page.locator('[data-fighter="wing"]').click();
    await advance(page, 220);
    await page.keyboard.press('KeyD'); await advance(page, 80);
    await page.keyboard.press('KeyJ'); await advance(page, 180);
  } else if (slug === 'racer') {
    await page.keyboard.down('ArrowUp'); await advance(page, 2600); await page.keyboard.up('ArrowUp');
  } else if (slug === 'breakout') {
    await press(page, 'Space', 800);
  } else if (slug === 'pong') {
    await page.keyboard.down('ArrowUp'); await advance(page, 180); await page.keyboard.up('ArrowUp'); await advance(page, 600);
  } else if (slug === 'invaders') {
    await page.keyboard.down('Space'); await advance(page, 750); await page.keyboard.up('Space');
  } else if (slug === 'redterraria') {
    await page.keyboard.down('ArrowRight'); await advance(page, 800); await page.keyboard.up('ArrowRight');
    await page.keyboard.press('Space'); await advance(page, 250);
  } else if (slug === 'asteroids') {
    await advance(page, 750); await page.keyboard.down('Space'); await advance(page, 170); await page.keyboard.up('Space');
  } else if (slug === 'greyride') {
    await page.locator('[data-choices] button').first().click();
    await advance(page, 260);
    await page.locator('[data-choices] button').first().click();
    await advance(page, 260);
  } else if (slug === 'sokoban') {
    for (const key of ['ArrowRight', 'ArrowRight', 'ArrowDown']) await press(page, key);
  } else if (slug === 'sakurablade') {
    for (const key of ['1', '2', '3']) { await page.keyboard.press(key); await advance(page, 120); }
  } else if (slug === 'simon') {
    for (let n = 0; n < 25 && !(await page.locator('.simon-button.active').count()); n++) await advance(page, 50);
  } else await advance(page, 200);
}

try {
  for (const game of games.filter(game => !requested.length || requested.includes(game.slug))) {
    const context = await browser.newContext({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await context.newPage(); const errors = [], failedRequests = [], external = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) failedRequests.push(response.url()); });
    page.on('request', request => { if (!request.url().startsWith(origin) && !request.url().startsWith('data:')) external.push(request.url()); });
    await page.clock.install({ time: initialTime });
    await page.clock.pauseAt(new Date(initialTime.getTime() + 1000));
    const url = `${origin}/games/${game.slug}/index.html`;
    await page.goto(url); await page.evaluate(() => document.fonts.ready);
    await prepare(page, game.slug);
    const selector = selectors[game.slug] ?? 'canvas';
    const field = page.locator(selector).first();
    const originalBounds = await field.boundingBox();
    if (!originalBounds?.width || !originalBounds?.height) throw new Error(`Missing board for ${game.slug}`);
    const scale = Math.min(720 / originalBounds.width, 450 / originalBounds.height, 1);
    // Framing only: do not resize logical game surfaces or modify their contents.
    await field.evaluate((element, factor) => {
      Object.assign(element.style, { transform: `scale(${factor})`, transformOrigin: 'center center', outline: 'none' });
      if (element.tagName === 'CANVAS') element.style.boxShadow = 'none';
    }, scale);
    await page.mouse.move(999, 899);
    const filename = `${game.slug}.jpg`, path = resolve(output, filename);
    await field.screenshot({ path, type: 'jpeg', quality: 78, animations: 'disabled', caret: 'hide', scale: 'css' });
    if (errors.length || failedRequests.length || external.length) throw new Error(`${game.slug}: ${JSON.stringify({ errors, failedRequests, external })}`);
    const image = await readFile(path), bytes = (await stat(path)).size, hash = createHash('sha256').update(image).digest('hex');
    const record = { ...game, localGame: url, selector, asset: `public/assets/game-thumbs/${filename}`, ...jpegDimensions(image), bytes, sha256: hash, capturedAt: new Date().toISOString() };
    results.push(record); console.log(`${game.slug}: ${record.width}x${record.height}, ${(bytes / 1024).toFixed(1)} KiB`);
    await context.close();
  }
} finally { await browser.close(); }

const merged = [...previous.filter(old => !results.some(item => item.slug === old.slug)), ...results].sort((a, b) => a.trackId.localeCompare(b.trackId));
const totalBytes = merged.reduce((sum, item) => sum + item.bytes, 0);
await writeFile(manifestPath, JSON.stringify({
  method: 'Playwright locator screenshot of real local gameplay; CSS framing only, no raster editing or game-state injection.',
  command: 'node scripts/capture-game-thumbnails.mjs',
  jpegQuality: 78, framingTarget: [720, 450], totalBytes,
  notes: 'Only the game field is captured. Native markings drawn into a game canvas are retained. Browser subpixel framing can add one pixel to an edge; recorded dimensions come from each JPEG header. Randomized boards vary between captures. Source license and adaptation details are recorded in docs/game-sources.md and sibling manifests.',
  games: merged,
}, null, 2) + '\n');
console.log(`${merged.length} thumbnails, ${(totalBytes / 1024).toFixed(1)} KiB total. Manifest: docs/game-thumbnails.json`);











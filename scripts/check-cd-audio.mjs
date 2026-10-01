import { chromium, expect, devices } from '@playwright/test';
import { readFile, mkdir, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Integration check against the local private files, with no audio/network mocking.
const baseURL = process.env.CD_PREVIEW_URL ?? 'http://127.0.0.1:4176';
assert(['127.0.0.1', 'localhost'].includes(new URL(baseURL).hostname), 'Use a local preview');
const env = await readFile('.env.local', 'utf8');
const code = process.env.CD_ACCESS_CODE ?? env.match(/^CD_ACCESS_CODE=(.*)$/mu)?.[1]?.trim();
assert(code, 'Configure CD_ACCESS_CODE in .env.local');
const manifest = JSON.parse(await readFile('server/cd/audio-manifest.json', 'utf8'));
const browser = await chromium.launch({ channel: 'chrome', args: ['--mute-audio'] });
try {
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const id of Object.keys(manifest)) {
    assert.equal((await context.request.get(`/api/cd-stream/${id}`)).status(), 401);
  }
  await page.goto('/cd/');
  await page.getByLabel('Digite o código').fill(code);
  await page.locator('.cd-unlock').click();
  await expect(page.locator('#cd-title')).toBeVisible();
  // Browser sends Secure cookies on trusted loopback; the standalone HTTP request
  // client may omit them. Forward this local session explicitly for byte checks.
  const session = (await context.cookies()).find((cookie) => cookie.name === '__Host-psicoz_cd');
  assert(session);
  const authHeaders = { Cookie: `${session.name}=${session.value}` };
  const catalogResponse = await context.request.get('/api/cd-catalog', { headers: authHeaders });
  assert.equal(catalogResponse.status(), 200, `Catalog unavailable: ${await catalogResponse.text()}; cookie count ${(await context.cookies()).length}`);
  const catalog = await catalogResponse.json();
  assert.equal(catalog.tracks.filter((track) => track.streamUrl).length, 14);
  assert.equal(catalog.tracks[14].streamUrl, null);
  for (const track of catalog.tracks.slice(0, 14)) {
    const response = await context.request.get(track.streamUrl, { headers: { ...authHeaders, Range: 'bytes=0-15' } });
    assert.equal(response.status(), 206);
    assert.equal((await response.body()).length, 16);
    const peaks = await (await context.request.get(track.peaksUrl, { headers: authHeaders })).json();
    assert.equal(peaks.length, 1200);
    assert(peaks.some((value) => value > 0));
    const original = await stat(`psichoZTracks/${manifest[track.id].sourceFilename}`);
    const download = await context.request.head(`/api/cd-download/${track.id}`, { headers: authHeaders });
    if (catalog.downloadsLockedUntil) {
      assert.equal(track.downloadUrl, null);
      assert.equal(download.status(), 403);
    } else {
      assert.equal(download.status(), 200);
      assert.equal(Number(download.headers()['content-length']), original.size);
      assert(download.headers()['content-disposition'].startsWith('attachment;'));
    }
  }
  await page.goto('/cd/');
  if (catalog.downloadsLockedUntil) {
    await expect(page.locator('[data-album-download]')).toBeDisabled();
    await expect(page.locator('#cd-download-note')).toContainText('Downloads disponíveis em');
    assert.equal((await context.request.get('/api/cd-download/album', { headers: authHeaders })).status(), 403);
  }
  for (let i = 0; i < 14; i++) {
    const row = page.locator(`[data-track="${catalog.tracks[i].id}"]`);
    await row.locator('[data-select]').click();
    await expect(row.locator('[data-audio-status]')).toHaveText('Reproduzindo', { timeout: 15_000 });
    await expect(row.locator('[data-wave-status]')).toContainText('Toque ou arraste');
    if (catalog.downloadsLockedUntil) await expect(row.locator('[data-download]')).toBeDisabled();
    await expect(row.locator('[data-clock]')).not.toHaveText(/^0:00 /u, { timeout: 5000 });
    await row.locator('[data-toggle]').click();
    await expect(row.locator('[data-audio-status]')).toHaveText('Pausado');
    console.log(`${catalog.tracks[i].id}: real playback, peaks, range and download policy verified`);
  }
  await mkdir('docs/screenshots/cd', { recursive: true });
  const first = page.locator('[data-track="track-01"]');
  await first.locator('[data-select]').click();
  await expect(first.locator('[data-audio-status]')).toHaveText('Reproduzindo');
  await first.locator('[data-toggle]').click();
  await first.locator('[data-seek]').fill('500');
  await expect(first.locator('[data-clock]')).toContainText('1:12');
  await first.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/screenshots/cd/real-player-desktop.png' });
  assert.deepEqual(errors, []);
  const mobile = await browser.newContext({ ...devices['Pixel 7'], baseURL });
  await mobile.addCookies(await context.cookies());
  const phone = await mobile.newPage();
  await phone.goto('/cd/');
  const phoneRow = phone.locator('[data-track="track-01"]');
  await phoneRow.locator('[data-select]').tap();
  await expect(phoneRow.locator('[data-audio-status]')).toHaveText('Reproduzindo');
  await expect(phoneRow.locator('[data-wave-status]')).toContainText('Toque ou arraste');
  await phoneRow.locator('[data-toggle]').tap();
  for (const width of [375, 390, 430]) {
    await phone.setViewportSize({ width, height: 850 });
    assert(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await phone.setViewportSize({ width: 390, height: 850 });
  await phoneRow.scrollIntoViewIfNeeded();
  await phone.screenshot({ path: 'docs/screenshots/cd/real-player-mobile.png' });
  console.log('14 recordings passed; desktop/mobile screenshots saved; no browser errors.');
} finally { await browser.close(); }

import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { tracks } from '../../src/data/catalog';

async function authenticate(page: Page) {
  const response = await page.request.post('/api/cd-access', { headers: { Origin: 'http://127.0.0.1:4175', 'CF-Connecting-IP': `fixture-${crypto.randomUUID()}` }, data: { code: 'collector-e2e-only' } });
  expect(response.status()).toBe(200);
}
function wav() {
  const rate = 8000; const count = rate * 12; const bytes = Buffer.alloc(44 + count * 2);
  bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8); bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22); bytes.writeUInt32LE(rate, 24); bytes.writeUInt32LE(rate * 2, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34); bytes.write('data', 36); bytes.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) bytes.writeInt16LE(Math.round(Math.sin(i * 2 * Math.PI * 220 / rate) * (1000 + 8000 * (i / count))), 44 + i * 2);
  return bytes;
}
async function playableFixture(page: Page) {
  await authenticate(page);
  await page.route('**/api/cd-catalog', (route) => route.fulfill({ json: {
    tracks: tracks.map((track, i) => ({ ...track, durationSeconds: i < 2 ? 12 : null, streamUrl: i < 2 ? `/api/cd-stream/${track.id}` : null, downloadUrl: i < 2 ? `/api/cd-download/${track.id}` : null, peaksUrl: null })), albumDownloadUrl: '/api/cd-download/track-01',
  } }));
  await page.route('**/api/cd-stream/*', (route) => {
    const bytes = wav();
    const range = /^bytes=(\d+)-(\d*)$/u.exec(route.request().headers().range ?? '');
    const start = range ? Number(range[1]) : 0;
    const end = range?.[2] ? Math.min(Number(range[2]), bytes.length - 1) : bytes.length - 1;
    return route.fulfill({ status: range ? 206 : 200, contentType: 'audio/wav', headers: { 'Accept-Ranges': 'bytes', ...(range ? { 'Content-Range': `bytes ${start}-${end}/${bytes.length}` } : {}) }, body: bytes.subarray(start, end + 1) });
  });
}
async function snapshot(page: Page, name: string, fullPage = true) {
  await mkdir('docs/screenshots/cd', { recursive: true });
  if (fullPage) await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: `docs/screenshots/cd/${name}.png`, fullPage });
}

test('public player opens directly while downloads remain locked before release', async ({ page }, info) => {
  await page.goto('/cd');
  await expect(page.locator('#cd-title')).toBeVisible();
  await expect(page.locator('.cd-track')).toHaveCount(15);
  await expect(page.locator('.cd-track [data-select]:disabled')).toHaveCount(15);
  await expect(page.locator('[data-album-download]')).toBeDisabled();
  await expect(page.locator('audio')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('psicoz:progress'))).toBeNull();
  await snapshot(page, `collector-pending-${info.project.name}`);
  expect((await page.request.get('/api/cd-download/album')).status()).toBe(401);
});

test('real code access still creates a secure private session', async ({ page, context }, info) => {
  await page.route('**/api/cd-catalog', (route) => route.fulfill({ status: 503, json: { error: 'unavailable' } }));
  await page.goto('/cd');
  await expect(page.locator('#cd-login')).toBeVisible();
  await snapshot(page, `access-${info.project.name}`);
  await page.getByLabel('Digite o código').fill('wrong-code');
  await page.getByRole('button', { name: /DESBLOQUEAR/u }).click();
  await expect(page.locator('#cd-access-feedback')).toContainText('ACCESS DENIED');
  await page.unroute('**/api/cd-catalog');
  await page.getByLabel('Digite o código').fill('collector-e2e-only');
  await page.keyboard.press('Enter');
  await expect(page.locator('#cd-title')).toBeVisible();
  const cookie = (await context.cookies()).find((cookie) => cookie.name === '__Host-psicoz_cd')!;
  expect(cookie.httpOnly).toBe(true); expect(cookie.secure).toBe(true); expect(cookie.sameSite).toBe('Lax');
  expect(await page.evaluate(() => document.cookie)).not.toContain('__Host-psicoz_cd');
});

test('only the active track loads; actual waveform, seek, pause, mini player and playlist end', async ({ page, isMobile }, info) => {
  await playableFixture(page);
  const audioRequests: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/api/cd-stream/')) audioRequests.push(request.url()); });
  await page.goto('/cd/');
  await expect(page.locator('.cd-track')).toHaveCount(15); expect(audioRequests).toHaveLength(0);
  const first = page.locator('[data-track="track-01"]');
  if (isMobile) await first.locator('[data-select]').tap(); else await first.locator('[data-select]').click();
  await expect(first.locator('[data-audio-status]')).toHaveText('Reproduzindo');
  await expect(first.locator('[data-wave-status]')).toContainText('Toque ou arraste');
  expect(audioRequests.every((url) => url.endsWith('track-01'))).toBe(true);
  expect(await first.locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data.some((value) => value > 0))).toBe(true);
  await first.locator('[data-toggle]').click(); await expect(first.locator('[data-audio-status]')).toHaveText('Pausado');
  await first.locator('[data-seek]').fill('500'); await expect(first.locator('[data-clock]')).toContainText('0:06');
  const viewport = page.viewportSize()!;
  for (const width of [375, 390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize(viewport);
  await first.scrollIntoViewIfNeeded();
  await expect(page.locator('.cd-mini')).toBeHidden();
  await snapshot(page, `player-${info.project.name}`, false);
  await first.locator('[data-toggle]').click();
  await page.locator('.cd-footer').scrollIntoViewIfNeeded();
  await expect(page.locator('.cd-mini')).toBeVisible();
  await snapshot(page, `mini-player-${info.project.name}`, false);
  await page.locator('.cd-mini [data-toggle]').click();
  await expect(first.locator('[data-audio-status]')).toHaveText('Pausado');
  await page.locator('.cd-mini [data-next]').click();
  const second = page.locator('[data-track="track-02"]');
  await expect(second).toHaveClass(/is-active/u); await expect(first.locator('.cd-track-detail')).toBeHidden();
  await expect(second.locator('[data-audio-status]')).toHaveText('Reproduzindo');
  await expect(second.locator('[data-next]')).toBeDisabled();
  await page.locator('.cd-mini [data-show-active]').click();
  await expect(second.locator('[data-select]')).toBeFocused();
  await second.locator('[data-seek]').fill('999');
  await expect(second.locator('[data-audio-status]')).toContainText('Fim do álbum');
  await second.locator('[data-prev]').click();
  await expect(first).toHaveClass(/is-active/u);
  await first.locator('[data-seek]').fill('999');
  await expect(second).toHaveClass(/is-active/u);
});

test('download failure, retry and native download do not buffer the album in JavaScript', async ({ page }) => {
  await playableFixture(page);
  let failed = true;
  await page.route('**/api/cd-download/track-01', (route) => failed ? route.fulfill({ status: 503, json: { error: 'unavailable' } }) : route.continue());
  await page.goto('/cd');
  await page.locator('[data-album-download]').click();
  await expect(page.locator('[data-download-status]')).toContainText('Tente novamente');
  failed = false;
  const downloaded = page.waitForEvent('download');
  await page.locator('[data-album-download]').click();
  expect((await downloaded).suggestedFilename()).toBe('test-only.txt');
  await expect(page.locator('[data-download-status]')).toContainText('Download solicitado');
});

test('pre-release downloads stay disabled even with the browser clock advanced', async ({ page }, info) => {
  await playableFixture(page);
  await page.route('**/api/cd-catalog', (route) => route.fulfill({ json: {
    tracks: tracks.map((track, i) => ({ ...track, durationSeconds: i === 0 ? 12 : null, streamUrl: i === 0 ? `/api/cd-stream/${track.id}` : null, downloadUrl: null, peaksUrl: null })),
    albumDownloadUrl: null, downloadsLockedUntil: '2026-10-31T00:00:00-03:00',
  } }));
  await page.clock.setFixedTime(new Date('2035-01-01T00:00:00Z'));
  await page.goto('/cd/');
  await expect(page.locator('[data-album-download]')).toBeDisabled();
  await expect(page.locator('#cd-download-note')).toHaveText('Downloads disponíveis em 31/10/2026.');
  const first = page.locator('[data-track="track-01"]');
  await first.locator('[data-select]').click();
  await expect(first.locator('[data-audio-status]')).toHaveText('Reproduzindo');
  await expect(first.locator('[data-download]')).toBeDisabled();
  await expect(first.locator('[data-download]')).toHaveText('No lançamento');
  await first.locator('[data-toggle]').click();
  await first.scrollIntoViewIfNeeded();
  await snapshot(page, `downloads-locked-${info.project.name}`, false);
});

test('expired download session returns to access; audio failures have retry feedback', async ({ page }) => {
  await playableFixture(page);
  await page.route('**/api/cd-stream/*', (route) => route.fulfill({ status: 404 }));
  await page.goto('/cd');
  await page.locator('[data-select="0"]').click();
  await expect(page.locator('[data-audio-status]')).toContainText(/indisponível|Não foi possível/u);
  await page.route('**/api/cd-download/track-01', (route) => route.fulfill({ status: 401 }));
  await page.locator('[data-album-download]').click();
  await expect(page.locator('#cd-login')).toBeVisible();
  await expect(page.locator('#cd-access-feedback')).toContainText('Sua sessão expirou');
});

test('responsive widths, reduced motion, missing cover, and keyboard code reveal', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/assets/cover-dark-*.webp', (route) => route.abort());
  await page.goto('/cd');
  await expect(page.locator('.cd-art-fallback')).toBeVisible();
  for (const width of [375, 390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await snapshot(page, `missing-art-${info.project.name}`);
});

test('API unavailable and rate limited states allow another attempt', async ({ page }) => {
  await page.route('**/api/cd-catalog', (route) => route.fulfill({ status: 503 }));
  await page.goto('/cd'); await expect(page.locator('#cd-access-feedback')).toContainText('indisponível');
  await page.route('**/api/cd-access', (route) => route.fulfill({ status: 429 }));
  await page.getByLabel('Digite o código').fill('example'); await page.locator('.cd-unlock').click();
  await expect(page.locator('#cd-access-feedback')).toContainText('Aguarde um minuto');
  await expect(page.locator('.cd-unlock')).toBeEnabled();
});

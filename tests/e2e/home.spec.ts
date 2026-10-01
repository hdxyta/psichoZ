import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const PROGRESS_KEY = 'psicoz:progress';

async function openSettings(page: Page): Promise<void> {
  const settings = page.locator('.progress-settings');
  if (!(await settings.evaluate((element) => (element as HTMLDetailsElement).open))) await settings.locator('summary').click();
  await expect(page.locator('#reset-progress')).toBeVisible();
}

async function openCollection(page: Page): Promise<void> {
  await page.getByRole('button', { name: /OPEN COLLECTION|Ver (minha )?coleção/u }).first().click();
  await expect(page.locator('#collection-popover')).toBeVisible();
}

async function expectNoVictories(page: Page): Promise<void> {
  await expect(page.locator('#collection-count')).toHaveText('0 de 15 faixas conquistadas no jogo');
  await expect(page.locator('#game-progress-count')).toHaveText('0 / 15');
  await expect(page.locator('#tracklist [data-recovered="true"]')).toHaveCount(0);
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), PROGRESS_KEY);
  expect(saved.unlockedTrackIds).toEqual([]);
  expect(saved.completedLevelIds).toEqual([]);
  expect(saved.collectibles).toEqual([]);
}

test('home has 15 honest track positions, no fake downloads, audio or game engine requests', async ({ page }) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await expect(page).toHaveTitle('psicoZ — YTA');
  await expect(page.locator('#release-date')).toHaveText('31/10/2026');
  await expect(page.locator('#hero-title')).toHaveText('psicoZ');
  await expect(page.locator('#release-label')).toContainText(/YTA|PSICOZ IS OUT NOW/u);
  await expect(page.locator('#jogo #tracklist > li')).toHaveCount(15);
  await expect(page.locator('#tracklist a.game-card-link')).toHaveCount(15);
  await expect(page.locator('#game-progress')).toHaveAttribute('value', '0');
  for (let number = 1; number <= 15; number += 1) {
    const id = `track-${String(number).padStart(2, '0')}`;
    const card = page.locator(`#tracklist [data-game-track="${id}"]`);
    const title = await card.locator('h3').innerText();
    await expect(card.getByRole('link', { name: `Jogar: ${title}`, exact: true })).toHaveAttribute('href', `#/jogar/${id}`);
    await expect(card).toHaveAttribute('data-recovered', 'false');
  }
  await expect(page.locator('[data-game-track="track-15"] h3')).toHaveText('FILE_15');
  await expect(page.locator('[data-game-track="track-01"] h3')).toHaveText('Woodstock');
  await expect(page.locator('#tracklist .track-name').filter({ hasText: 'Título a confirmar' })).toHaveCount(0);
  await expect(page.locator('#rewards-list > li')).toHaveCount(17);
  await expect(page.locator('#rewards-list .reward-action').filter({ hasText: 'SEALED' })).toHaveCount(17);
  await expect(page.locator('a[download], audio, canvas')).toHaveCount(0);
  await expect(page.locator('#artist-bio')).toContainText('YTA é o artista por trás de psicoZ');
  await expect(page.locator('#album-concept')).toContainText('psicoZ é um álbum de 15 faixas');
  expect(requests.filter((url) => /(?:three(?:[./-]|$)|\/game\/|\/assets\/(?:runtime|action|puzzles|world)[.-]|\.(?:mp3|wav|ogg|m4a)(?:[?#]|$))/iu.test(url))).toEqual([]);
  expect(errors).toEqual([]);
});

test('cover pointer or touch opens an accessible pending panel, traps focus and returns it on Escape', async ({ page, isMobile }) => {
  await page.goto('/');
  const cover = page.locator('#cover-button');
  if (isMobile) await cover.tap();
  else await cover.click();
  const dialog = page.getByRole('dialog', { name: 'PRE-SAVE PSICOZ.' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: /Spotify de YTA/u })).toHaveAttribute('href', /open\.spotify\.com/u);
  await expect(dialog).toContainText('Abrir um link não confirma');
  const close = dialog.getByRole('button', { name: 'Fechar painel de pré-save' });
  const spotify = dialog.getByRole('link', { name: /Spotify de YTA/u });
  await expect(close).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(spotify).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(spotify).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(cover).toBeFocused();
});

test('cover is operable with Enter and Space and the close button restores keyboard focus', async ({ page }) => {
  await page.goto('/');
  const cover = page.locator('#cover-button');
  for (const key of ['Enter', 'Space']) {
    await cover.focus();
    await page.keyboard.press(key);
    await expect(page.locator('#presave-dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Fechar painel de pré-save' }).click();
    await expect(page.locator('#presave-dialog')).not.toBeVisible();
    await expect(cover).toBeFocused();
  }
});

test('real section anchors support browser back and forward navigation', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Navegação principal' });
  for (const [name, hash] of [['Album', 'album'], ['YTA', 'artista'], ['Play', 'faixas'], ['Collection', 'colecao']]) {
    await nav.getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${hash}$`, 'u'));
    await expect(page.locator(`#${hash}`)).toBeInViewport();
  }
  await page.goBack();
  await expect(page).toHaveURL(/#faixas$/u);
  await expect(page.locator('#faixas')).toBeInViewport();
  await expect(page.locator('#jogo')).toBeInViewport();
  await page.goForward();
  await expect(page).toHaveURL(/#colecao$/u);
  await expect(page.locator('#colecao')).toBeInViewport();
});

test('NFC URL persists access on reload without granting victories or publishing files', async ({ page }) => {
  await page.goto('/?edition=nfc');
  await expect(page).toHaveURL(/\?edition=nfc#colecao$/u);
  await expect(page.locator('#collection-status')).toContainText('NFC ACCESS liberado');
  await expect(page.locator('#rewards-list')).toContainText('NFC ACCESS');
  await expect(page.locator('#colecao')).toBeInViewport();
  await expectNoVictories(page);
  await page.reload();
  await expect(page.locator('#collection-status')).toContainText('NFC ACCESS liberado');
  await expectNoVictories(page);
  await expect(page.locator('a[download]')).toHaveCount(0);
  await page.goto('/#colecao');
  await expect(page.locator('#collection-status')).toContainText('NFC ACCESS liberado');
});

for (const fixture of [
  { name: 'corrupted JSON', raw: '{broken', message: 'O progresso salvo não pôde ser lido.' },
  { name: 'a future version', raw: JSON.stringify({ version: 99, albumId: 'psicoz', preserve: 'future data' }), message: 'O progresso salvo pertence a outra versão.' },
]) {
  test(`preserves ${fixture.name} and presents a visible memory fallback`, async ({ page }) => {
    await page.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), { key: PROGRESS_KEY, raw: fixture.raw });
    await page.goto('/?edition=nfc');
    await expect(page.locator('#collection-status')).toContainText(fixture.message);
    await expect(page.locator('#collection-status')).toContainText('NFC ACCESS liberado');
    await openSettings(page);
    await expect(page.locator('#storage-status')).toBeVisible();
    await expect(page.locator('#storage-status')).toContainText(fixture.message);
    expect(await page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY)).toBe(fixture.raw);
    await expect(page.locator('#collection-count')).toContainText('0 de 15');
  });
}

test('blocked localStorage getter keeps the NFC collection usable in memory', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Blocked for test', 'SecurityError'); } });
  });
  await page.goto('/?edition=nfc');
  await expect(page.locator('#collection-status')).toContainText('armazenamento está indisponível');
  await expect(page.locator('#collection-status')).toContainText('NFC ACCESS liberado');
  await openSettings(page);
  await page.getByRole('checkbox', { name: 'Reduzir movimento' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  expect(errors).toEqual([]);
});

test('storage write failure warns honestly and does not claim persistent NFC access', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () { throw new DOMException('Quota exceeded for test', 'QuotaExceededError'); };
  });
  await page.goto('/?edition=nfc');
  await expect(page.locator('#collection-status')).toContainText('NFC ACCESS liberado');
  await expect(page.locator('#collection-status')).toContainText('Não foi possível salvar o progresso.');
  expect(await page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY)).toBeNull();
  await page.goto('/#colecao');
  await expect(page.locator('#collection-status')).toHaveText('PLAY → COMPLETE → UNLOCK. Complete experiências para registrar conquistas; a edição NFC libera acesso aos materiais publicados.');
  await expect(page.locator('#collection-status')).not.toContainText('Acesso da edição NFC liberado');
});

test('reset cancel preserves access; confirmed reset removes only project progress and the NFC query', async ({ page }) => {
  await page.goto('/?edition=nfc&source=test#colecao');
  await page.evaluate(() => localStorage.setItem('another-project:progress', 'keep this value'));
  await openSettings(page);
  const reset = page.getByRole('button', { name: 'Apagar progresso local', exact: true });
  await reset.click();
  const dialog = page.getByRole('dialog', { name: 'Apagar progresso?' });
  await expect(dialog.getByRole('button', { name: 'Manter progresso' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Manter progresso' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(reset).toBeFocused();
  await expect(page.locator('#collection-status')).toContainText('NFC ACCESS liberado');
  await reset.click();
  await dialog.getByRole('button', { name: 'Apagar progresso', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('#collection-status')).toHaveText('PLAY → COMPLETE → UNLOCK. Complete experiências para registrar conquistas; a edição NFC libera acesso aos materiais publicados.');
  expect(new URL(page.url()).searchParams.has('edition')).toBe(false);
  expect(new URL(page.url()).searchParams.get('source')).toBe('test');
  const records = await page.evaluate((key) => ({ own: localStorage.getItem(key), other: localStorage.getItem('another-project:progress') }), PROGRESS_KEY);
  expect(records).toEqual({ own: null, other: 'keep this value' });
  await page.reload();
  await expect(page.locator('#collection-status')).not.toContainText('NFC ACCESS liberado');
});

test('reduced motion follows the OS and persists an explicit visitor preference', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#colecao');
  await openSettings(page);
  const checkbox = page.getByRole('checkbox', { name: 'Reduzir movimento' });
  await expect(checkbox).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await expect(page.locator('#cover-button')).toHaveCSS('transition-duration', '0s');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  await page.reload();
  await openSettings(page);
  await expect(checkbox).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await expect(page.locator('#cover-button')).toHaveCSS('transition-duration', '0s');
});

test('unknown game route returns to the 15-game hub and keeps the collection available on reload', async ({ page }) => {
  await page.goto('/#/jogar/track-99');
  await expect(page).toHaveURL(/#jogo$/u);
  await expect(page.locator('#jogo')).toBeInViewport();
  await expect(page.locator('#tracklist > li')).toHaveCount(15);
  await expect(page.locator('#announcement')).toHaveText('Jogo não encontrado. Escolha uma das 15 faixas para jogar.');
  await expect(page.locator('canvas, audio')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#jogo')).toBeInViewport();
  await openCollection(page);
  await expect(page.locator('#rewards-list > li')).toHaveCount(17);
  await expect(page.locator('#collection-count')).toContainText('0 de 15');
});

test('missing optional art offers a working retry without breaking the home', async ({ page }) => {
  let requests = 0;
  await page.route('**/assets/cover-light-900.webp', async (route) => {
    requests += 1;
    if (requests === 1) await route.fulfill({ status: 404, body: 'Not found' });
    else await route.continue();
  });
  const failed = page.waitForResponse((response) => response.url().endsWith('/assets/cover-light-900.webp') && response.status() === 404);
  await page.goto('/');
  await page.locator('#album').scrollIntoViewIfNeeded();
  await failed;
  const fallback = page.locator('#album .image-failure');
  await expect(fallback).toContainText('Esta arte não carregou.');
  await expect(page.locator('#tracklist > li')).toHaveCount(15);
  const recovered = page.waitForResponse((response) => response.url().endsWith('/assets/cover-light-900.webp') && response.ok());
  await fallback.getByRole('button', { name: 'Tentar carregar a arte' }).click();
  await recovered;
  await expect(fallback).toHaveCount(0);
  await expect.poll(() => page.locator('#album img').evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.locator('#cover-button').click();
  await expect(page.locator('#presave-dialog')).toBeVisible();
});

test('layout has no horizontal overflow at phone, tablet or desktop widths', async ({ page }) => {
  await page.goto('/');
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.locator('#cover-button').click();
    const dialog = page.locator('#presave-dialog');
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    await page.keyboard.press('Escape');
  }
});

test('captures home, pre-save panel and collection for visual review', async ({ page }, testInfo) => {
  const folder = resolve('docs/screenshots/tracklist-games-2026-09-30');
  await mkdir(folder, { recursive: true });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  for (const image of await page.locator('main img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(folder, `home-${testInfo.project.name}.png`), fullPage: true, animations: 'disabled', scale: 'css' });
  const trigger = page.getByRole('button', { name: /PRE-SAVE PSICOZ|OUVIR PSICOZ/u });
  await trigger.click();
  await expect(page.locator('#presave-dialog')).toBeVisible();
  await page.screenshot({ path: resolve(folder, `panel-${testInfo.project.name}.png`), animations: 'disabled', scale: 'css' });
  await page.keyboard.press('Escape');
  await expect(page.locator('#presave-dialog')).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Collection', exact: true }).click();
  await expect(page).toHaveURL(/#colecao$/u);
  await expect(page.locator('#colecao')).toBeInViewport();
  await openCollection(page);
  // A viewport image avoids Chromium's offscreen fixed-element artifacts in tall locator captures.
  // The full-page home image above includes the compact collection entry for layout review.
  await page.screenshot({ path: resolve(folder, `collection-${testInfo.project.name}.png`), animations: 'disabled', scale: 'css' });
});

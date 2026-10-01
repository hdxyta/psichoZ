import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const PROGRESS_KEY = 'psicoz:progress';
const GAME_ROUTE = '/#/jogar/track-01';
const captures = resolve('docs/screenshots/game-controls-2026-09-21');
const runtimeScript = /\/assets\/runtime-[^/]+\.js(?:[?#]|$)/u;
const audioFile = /\.(?:mp3|wav|ogg|m4a)(?:[?#]|$)/iu;

async function ready(page: Page): Promise<void> {
  await page.goto(GAME_ROUTE);
  await expect(page.getByRole('dialog', { name: 'Woodstock — fase 1' })).toBeVisible();
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'ready');
  await expect(page.locator('.game-world canvas')).toHaveCount(1);
}

async function start(page: Page, isMobile: boolean): Promise<void> {
  if (!isMobile && !(await page.locator('[data-keyboard]').isVisible())) {
    await page.locator('[data-controls] > summary').click();
  }
  await page.locator(isMobile ? '[data-start]' : '[data-keyboard]').click();
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'playing');
  await expect(page.locator('.game-world canvas')).toBeFocused();
}

async function pause(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Pausar partida' }).click();
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'paused');
}

async function mapPosition(page: Page): Promise<{ x: number; z: number; rotation: number }> {
  const transform = await page.locator('[data-map-player]').getAttribute('transform');
  const match = /^translate\(([-.\d]+) ([-.\d]+)\) rotate\(([-.\d]+)\)$/u.exec(transform ?? '');
  expect(match, 'The visible pause map must report the player position').not.toBeNull();
  return { x: Number(match![1]), z: Number(match![2]), rotation: Number(match![3]) };
}

async function expectNoReward(page: Page): Promise<void> {
  const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), PROGRESS_KEY);
  expect(progress.completedLevelIds ?? []).toEqual([]);
  expect(progress.unlockedTrackIds ?? []).toEqual([]);
  expect(progress.collectibles ?? []).toEqual([]);
  await expect(page.locator('a[download]')).toHaveCount(0);
}

test('loads the game only after an explicit route, begins silently and releases it on exit', async ({ page, isMobile }) => {
  const scripts: string[] = [];
  const audioRequests: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(request.url());
    if (audioFile.test(request.url())) audioRequests.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#tracklist > li')).toHaveCount(15);
  expect(scripts.filter((url) => runtimeScript.test(url))).toEqual([]);
  await expect(page.locator('#game-dialog, canvas')).toHaveCount(0);
  await page.locator('#jogo').getByRole('link', { name: 'Jogar Woodstock' }).click();
  await expect(page).toHaveURL(/#\/jogar\/track-01$/u);
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'ready');
  expect(scripts.filter((url) => runtimeScript.test(url))).toHaveLength(1);
  await expect(page.getByRole('checkbox', { name: 'Ativar áudio de teste' })).not.toBeChecked();
  await start(page, isMobile);
  await page.keyboard.press('Space');
  await pause(page);
  expect(audioRequests).toEqual([]);
  await page.getByRole('button', { name: 'Voltar à home' }).click();
  await expect(page).toHaveURL(/#jogo$/u);
  await expect(page.locator('#game-dialog, canvas')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveClass(/game-open/u);
  await expectNoReward(page);
  await page.locator('#jogo').getByRole('link', { name: 'Jogar Woodstock' }).click();
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'ready');
  await expect(page.locator('.game-world canvas')).toHaveCount(1);
  await expect(page.locator('[data-symbol-count]')).toHaveText('0 / 3');
  expect(scripts.filter((url) => runtimeScript.test(url))).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('direct route and reload keep menus keyboard-contained with honest audio settings', async ({ page, isMobile }) => {
  await ready(page);
  const enter = page.getByRole('button', { name: 'Entrar no labirinto' });
  const first = page.locator('[data-control-mode="mouse"]');
  const map = page.getByText('Mapa do labirinto', { exact: true });
  await expect(enter).toBeFocused();
  await first.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(map).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(first).toBeFocused();
  await expect(page.locator('details[data-controls]')).not.toHaveAttribute('open', '');
  await expect(page.locator('.game-map-details')).not.toHaveAttribute('open', '');
  await expect(page.locator('.game-demo-note')).toHaveText('Som demonstrativo original. Não é a música Woodstock.');
  await page.getByText('Controles e ajustes', { exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Sensibilidade', exact: true })).toHaveValue('1');
  await expect(page.getByRole('slider', { name: 'Música de teste', exact: true })).toHaveValue('0.3');
  await expect(page.getByRole('slider', { name: 'Efeitos', exact: true })).toHaveValue('0.3');
  for (const name of ['Sensibilidade', 'Música de teste', 'Efeitos']) {
    const slider = page.getByRole('slider', { name, exact: true });
    await slider.scrollIntoViewIfNeeded();
    await expect(slider).toBeInViewport();
    const box = await slider.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
  await page.getByRole('checkbox', { name: 'Reduzir movimento', exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await page.reload();
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'ready');
  await page.getByText('Controles e ajustes', { exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Reduzir movimento', exact: true })).toBeChecked();
  await start(page, isMobile);
  await page.keyboard.press('Escape');
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'paused');
  await expect(page.getByRole('button', { name: 'Retomar partida' })).toBeFocused();
  await expectNoReward(page);
});

test('keyboard movement, turning, pause and restart use actual player inputs', async ({ page, isMobile }) => {
  await ready(page);
  const spawn = await mapPosition(page);
  await start(page, isMobile);
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(550); // Real held movement; no simulation state is written by the test.
  await page.keyboard.up('ArrowUp');
  await page.keyboard.press('KeyP');
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'paused');
  const moved = await mapPosition(page);
  expect(moved.z).toBeLessThan(spawn.z - 0.2);
  expect(Math.abs(moved.x - spawn.x)).toBeLessThan(0.1);
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(250);
  await page.keyboard.up('ArrowUp');
  expect(await mapPosition(page)).toEqual(moved);
  await start(page, isMobile);
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'playing');
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(350);
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.press('Space');
  await page.keyboard.press('KeyE');
  await pause(page);
  const turned = await mapPosition(page);
  expect(Math.abs(turned.rotation - moved.rotation)).toBeGreaterThan(5);
  expect(Math.abs(turned.z - moved.z)).toBeLessThan(0.1);
  await page.getByRole('button', { name: 'Recomeçar fase' }).click();
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'ready');
  expect(await mapPosition(page)).toEqual(spawn);
  await expect(page.locator('[data-health]')).toHaveText('100');
  await expect(page.locator('[data-symbol-count]')).toHaveText('0 / 3');
  await expectNoReward(page);
});

test('pointer-lock refusal keeps an honest menu with keyboard play available', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Touch controls do not request pointer lock.');
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.requestPointerLock = () => Promise.reject(new DOMException('Denied for test', 'NotAllowedError'));
  });
  await ready(page);
  await page.getByRole('button', { name: 'Entrar no labirinto' }).click();
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'ready');
  await expect(page.locator('.game-mouse-fallback')).toBeVisible();
  await expect(page.locator('[data-drag]')).toBeVisible();
  await start(page, false);
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'playing');
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();
});

test('native pointer-lock acquisition and release pause the game and allow resume', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Touch controls do not request pointer lock.');
  await ready(page);
  await page.getByRole('button', { name: 'Entrar no labirinto' }).click();
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'playing');
  await expect.poll(() => page.evaluate(() => document.pointerLockElement === document.querySelector('.game-world canvas'))).toBe(true);
  await page.evaluate(() => document.exitPointerLock());
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'paused');
  await expect(page.getByRole('button', { name: 'Retomar partida' })).toBeFocused();
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();
  await start(page, false);
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'playing');
  await expectNoReward(page);
});

test('synthetic browser blur and hidden-page signals pause the game without awarding progress', async ({ page, isMobile }) => {
  await ready(page);
  await start(page, isMobile);
  // Lifecycle-handler regression only: this does not claim to reproduce an OS Alt-Tab.
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'paused');
  await start(page, isMobile);
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'playing');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    Reflect.deleteProperty(document, 'hidden');
  });
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'paused');
  await expect(page.getByRole('button', { name: 'Retomar partida' })).toBeFocused();
  await expectNoReward(page);
});

test('actual WebGL context loss shows a recoverable error and permits a new session', async ({ page, isMobile }) => {
  await ready(page);
  await start(page, isMobile);
  const requested = await page.locator('.game-world canvas').evaluate((element) => {
    const gl = (element as HTMLCanvasElement).getContext('webgl2');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (!extension) return false;
    extension.loseContext();
    return true;
  });
  expect(requested, 'Chrome must expose context loss for this real WebGL failure test').toBe(true);
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'error');
  await expect(page.locator('[data-error]')).toHaveText('O navegador perdeu o contexto gráfico. Saia e abra a fase novamente.');
  const exit = page.getByRole('button', { name: 'Voltar à home' });
  await expect(exit).toBeFocused();
  await exit.click();
  await expect(page.locator('#game-dialog, canvas')).toHaveCount(0);
  await page.locator('#jogo').getByRole('link', { name: 'Jogar Woodstock' }).click();
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'ready');
  await start(page, isMobile);
  await pause(page);
  await expectNoReward(page);
});

test('unavailable WebGL keeps the home, collection and exit operable', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextId: string, ...args: unknown[]) {
      if (contextId === 'webgl2') return null;
      return Reflect.apply(getContext, this, [contextId, ...args]);
    } as typeof getContext;
  });
  await page.goto(GAME_ROUTE);
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'error');
  await expect(page.locator('[data-error]')).toContainText('WebGL 2 não está disponível.');
  await expect(page.locator('[data-start]')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Voltar à home' })).toBeFocused();
  await page.getByRole('button', { name: 'Voltar à home' }).click();
  await expect(page.locator('#game-dialog')).toHaveCount(0);
  await page.locator('#jogo').getByRole('link', { name: 'Ver minha coleção' }).click();
  await expect(page).toHaveURL(/#colecao$/u);
  await expect(page.locator('#rewards-list > li')).toHaveCount(17);
  await expectNoReward(page);
});

test('a failed decorative texture leaves the maze playable with an honest notice', async ({ page, isMobile }) => {
  await page.route('**/assets/cover-dark-640.webp', (route) => route.fulfill({ status: 404, body: 'Missing for test' }));
  const missing = page.waitForResponse((response) => response.url().endsWith('/assets/cover-dark-640.webp') && response.status() === 404);
  await ready(page);
  await missing;
  await expect(page.locator('[data-notice]')).toHaveText('Uma arte não carregou; o labirinto continua jogável.');
  await start(page, isMobile);
  await expect(page.locator('.game-world canvas')).toBeVisible();
  await page.keyboard.press('KeyP');
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'paused');
  await expectNoReward(page);
});

test('audio is requested only after opt-in and a failed demo stays playable', async ({ page, isMobile }) => {
  const requests: string[] = [];
  page.on('request', (request) => { if (audioFile.test(request.url())) requests.push(request.url()); });
  await page.route('**/audio/woodstock-demo-v1.wav', (route) => route.fulfill({ status: 404, body: 'Missing for test' }));
  await ready(page);
  await start(page, isMobile);
  await pause(page);
  expect(requests).toEqual([]);
  await page.getByRole('checkbox', { name: 'Ativar áudio de teste' }).check();
  expect(requests).toEqual([]);
  const missing = page.waitForResponse((response) => response.url().endsWith('/audio/woodstock-demo-v1.wav') && response.status() === 404);
  await start(page, isMobile);
  await missing;
  await expect(page.locator('[data-notice]')).toHaveText(/^(?:O áudio de teste não carregou\. Você pode continuar sem som\.|O navegador não iniciou o áudio\. Retome a partida ou jogue sem som\.)$/u);
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'playing');
  expect(requests).toHaveLength(1);
  await pause(page);
  await page.getByRole('checkbox', { name: 'Ativar áudio de teste' }).uncheck();
  await start(page, isMobile);
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'playing');
  await expectNoReward(page);
});

test('touch joystick and look gestures move and turn without scrolling the page', async ({ page, isMobile, context }) => {
  test.skip(!isMobile, 'This case exercises real touch events in the mobile project.');
  await ready(page);
  const spawn = await mapPosition(page);
  await start(page, isMobile);
  await expect(page.locator('.woodstock-game')).toHaveAttribute('data-touch', 'true');
  const scroll = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
  const session = await context.newCDPSession(page);
  const stick = await page.locator('[data-joystick]').boundingBox();
  expect(stick).not.toBeNull();
  const x = stick!.x + stick!.width / 2;
  const y = stick!.y + stick!.height / 2;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - 35, id: 1 }] });
  await page.waitForTimeout(550);
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await pause(page);
  const moved = await mapPosition(page);
  expect(moved.z).toBeLessThan(spawn.z - 0.2);
  await page.getByRole('button', { name: 'Retomar partida' }).tap();
  const look = await page.locator('[data-look-zone]').boundingBox();
  expect(look).not.toBeNull();
  const lookX = look!.x + look!.width / 2;
  const lookY = look!.y + 80;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: lookX, y: lookY, id: 2 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: lookX + 60, y: lookY, id: 2 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.locator('[data-fire]').tap();
  await page.locator('[data-interact]').tap();
  await pause(page);
  expect(Math.abs((await mapPosition(page)).rotation - moved.rotation)).toBeGreaterThan(5);
  expect(await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }))).toEqual(scroll);
  await expectNoReward(page);
  await session.detach();
});

test('captures the menu, live playfield and pause state at each supported viewport', async ({ page, isMobile }, testInfo) => {
  await mkdir(captures, { recursive: true });
  await ready(page);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(captures, `game-menu-${testInfo.project.name}.png`), animations: 'disabled', scale: 'css' });
  await start(page, isMobile);
  await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
  await page.screenshot({ path: resolve(captures, `game-playing-${testInfo.project.name}.png`), animations: 'disabled', scale: 'css' });
  await pause(page);
  await page.getByText('Mapa do labirinto', { exact: true }).click();
  await expect(page.locator('.game-map')).toBeVisible();
  await page.screenshot({ path: resolve(captures, `game-pause-${testInfo.project.name}.png`), animations: 'disabled', scale: 'css' });
  if (isMobile) {
    await page.setViewportSize({ width: 915, height: 412 });
    await page.getByRole('button', { name: 'Retomar partida' }).tap();
    await expect(page.locator('.woodstock-game')).toHaveAttribute('data-screen', 'playing');
    await expect(page.getByRole('button', { name: 'Pausar partida' })).toBeInViewport();
    await expect(page.locator('[data-joystick]')).toBeInViewport();
    await expect(page.locator('[data-fire]')).toBeInViewport();
    await page.screenshot({ path: resolve(captures, 'game-playing-mobile-landscape.png'), animations: 'disabled', scale: 'css' });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

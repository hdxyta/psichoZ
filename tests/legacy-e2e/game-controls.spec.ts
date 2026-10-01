import { expect, test, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const captures = resolve('docs/screenshots/game-controls-2026-09-21');
const rootSelector = '.woodstock-game';

async function ready(page: Page): Promise<void> {
  await page.goto('/#/jogar/track-01');
  await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'ready');
}

async function frames(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
}

async function readMap(page: Page): Promise<{ x: number; z: number; rotation: number }> {
  const transform = await page.locator('[data-map-player]').getAttribute('transform');
  const match = /^translate\(([-.\d]+) ([-.\d]+)\) rotate\(([-.\d]+)\)$/u.exec(transform ?? '');
  expect(match).not.toBeNull();
  return { x: Number(match![1]), z: Number(match![2]), rotation: Number(match![3]) };
}

/** Observes the real crosshair's visual state; it never changes simulation or input. */
async function firePulse(page: Page, requireRest = false): Promise<boolean> {
  return page.locator(rootSelector).evaluate((root, restFirst) => new Promise<boolean>((resolve) => {
    let seenRest = !restFirst || root.getAttribute('data-firing') !== 'true';
    const observer = new MutationObserver(() => {
      const firing = root.getAttribute('data-firing') === 'true';
      if (!firing) seenRest = true;
      if (firing && seenRest) finish(true);
    });
    const finish = (result: boolean) => { clearTimeout(timer); observer.disconnect(); resolve(result); };
    const timer = setTimeout(() => finish(false), 1800);
    observer.observe(root, { attributes: true, attributeFilter: ['data-firing'] });
    if (!restFirst && root.getAttribute('data-firing') === 'true') finish(true);
  }), requireRest);
}

async function pause(page: Page): Promise<void> {
  await page.keyboard.press('KeyP');
  await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'paused');
}

test('native desktop mouse changes yaw and pitch and a quick left click fires', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Native desktop pointer lock uses a mouse.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  const initial = await readMap(page);
  const trigger = page.locator('[data-start]');
  const box = await trigger.boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;
  await trigger.click();
  await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'playing');
  await expect.poll(() => page.evaluate(() => document.pointerLockElement === document.querySelector('.game-world canvas'))).toBe(true);
  await frames(page);
  const viewport = page.viewportSize()!;
  const clip = { x: Math.round(viewport.width * 0.2), y: Math.round(viewport.height * 0.25), width: Math.round(viewport.width * 0.6), height: Math.round(viewport.height * 0.35) };
  const beforePitch = await page.screenshot({ clip, scale: 'css' });
  await page.mouse.move(x, y - 80, { steps: 5 });
  await frames(page);
  const afterPitch = await page.screenshot({ clip, scale: 'css' });
  const before = await sharp(beforePitch).removeAlpha().resize(160, 100).raw().toBuffer();
  const after = await sharp(afterPitch).removeAlpha().resize(160, 100).raw().toBuffer();
  const meanPixelChange = before.reduce((total, value, index) => total + Math.abs(value - after[index]), 0) / before.length / 255;
  expect(meanPixelChange, 'Vertical mouse movement must visibly change the rendered view').toBeGreaterThan(0.025);
  await mkdir(captures, { recursive: true });
  await writeFile(resolve(captures, 'mouse-before-pitch.png'), beforePitch);
  await writeFile(resolve(captures, 'mouse-after-pitch.png'), afterPitch);
  await page.mouse.move(x + 120, y - 80, { steps: 6 });
  await frames(page);
  const pulse = firePulse(page);
  await page.mouse.click(x + 120, y - 80);
  expect(await pulse, 'A quick real left click must not disappear between rendering frames').toBe(true);
  await pause(page);
  const turned = await readMap(page);
  expect(Math.abs(turned.rotation - initial.rotation)).toBeGreaterThan(5);
  expect(turned.x).toBe(initial.x);
  expect(turned.z).toBe(initial.z);
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();
});

test('denied mouse capture keeps the menu honest and free mouse drag remains playable', async ({ page, isMobile }) => {
  test.skip(isMobile, 'This fallback is specific to desktop mouse capture.');
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.requestPointerLock = () => Promise.reject(new DOMException('Denied for test', 'NotAllowedError'));
  });
  await ready(page);
  const initial = await readMap(page);
  await page.locator('[data-start]').click();
  await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'ready');
  await expect(page.locator('.game-mouse-fallback')).toBeVisible();
  await page.getByRole('button', { name: 'Jogar com mouse livre', exact: true }).click();
  await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'playing');
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();
  const canvas = await page.locator('.game-world canvas').boundingBox();
  const x = canvas!.x + canvas!.width / 2;
  const y = canvas!.y + canvas!.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(x + 100, y - 45, { steps: 5 });
  await frames(page);
  const pulse = firePulse(page);
  await page.mouse.click(x + 100, y - 45);
  expect(await pulse).toBe(true);
  // The left click must not release the right button's independent look gesture.
  await page.mouse.move(x + 160, y - 45, { steps: 4 });
  await page.mouse.up({ button: 'right' });
  await pause(page);
  const movedView = await readMap(page);
  // The first 100 px alone produce ~12.6 degrees; >18 also requires the 60 px after the left release.
  expect(Math.abs(movedView.rotation - initial.rotation)).toBeGreaterThan(18);
  await page.locator('[data-start]').click();
  await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'playing');
  await expect(page.locator(rootSelector)).toHaveAttribute('data-controls', 'drag');
  await pause(page);
  expect(await readMap(page)).toEqual(movedView);
  await page.locator('[data-control-mode="mouse"]').click();
  await page.locator('[data-start]').click();
  await expect(page.locator('.game-mouse-fallback')).toBeVisible();
  await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'paused');
  expect(await readMap(page)).toEqual(movedView);
});

test('mouse capture can be retried after one refusal without starting a ghost session', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Native pointer-lock retry is a desktop scenario.');
  await page.addInitScript(() => {
    const native = HTMLCanvasElement.prototype.requestPointerLock;
    let refused = false;
    HTMLCanvasElement.prototype.requestPointerLock = function (...args) {
      if (!refused) { refused = true; return Promise.reject(new DOMException('First request denied for test', 'NotAllowedError')); }
      return Reflect.apply(native, this, args);
    };
  });
  await ready(page);
  const spawn = await readMap(page);
  await page.locator('[data-start]').click();
  await expect(page.locator('.game-mouse-fallback')).toBeVisible();
  await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'ready');
  expect(await readMap(page)).toEqual(spawn);
  await page.locator('[data-start]').click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement === document.querySelector('.game-world canvas'))).toBe(true);
  await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'playing');
  await pause(page);
  expect(await readMap(page)).toEqual(spawn);
});

test('synthetic same-task down and up retain the initial shot until the next frame', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Isolated event-buffer regression; mobile gestures are covered with real CDP touch events.');
  await ready(page);
  await page.locator('[data-controls] > summary').click();
  await page.locator('[data-keyboard]').click();
  await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'playing');
  const pulse = firePulse(page);
  // Deliberately synthetic event-buffer regression. This is not a gameplay or native-pointer-lock claim.
  await page.locator('.game-world canvas').evaluate((canvas) => {
    canvas.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, buttons: 1 }));
    canvas.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, buttons: 0 }));
  });
  expect(await pulse).toBe(true);
  await expect(page.locator(rootSelector)).toHaveAttribute('data-firing', 'false');
  expect(await page.evaluate(() => localStorage.getItem('psicoz:progress'))).toBeNull();
});

test('fullscreen is opt-in and F can enter and leave it without restarting', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop Chrome validates the actual fullscreen API; device support remains browser-dependent.');
  await ready(page);
  const spawn = await readMap(page);
  expect(await page.evaluate(() => document.fullscreenElement)).toBeNull();
  await page.locator('details[data-controls] > summary').click();
  await page.locator('[data-keyboard]').click();
  await page.keyboard.press('KeyF');
  await expect.poll(() => page.evaluate(() => document.fullscreenElement === document.querySelector('.woodstock-game'))).toBe(true);
  await expect(page.locator('[data-fullscreen]')).toHaveAttribute('aria-label', 'Sair da tela cheia');
  await page.keyboard.press('KeyF');
  await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
  await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'paused');
  expect(await readMap(page)).toEqual(spawn);
  await page.locator('[data-start]').click();
  await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'playing');
  await expect(page.locator(rootSelector)).toHaveAttribute('data-controls', 'keyboard');
});

test('three simultaneous mobile contacts keep movement and shooting when another finger is released', async ({ page, context, isMobile }) => {
  test.skip(!isMobile, 'This scenario uses mobile multitouch.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  const spawn = await readMap(page);
  await page.locator('[data-start]').tap();
  await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'playing');
  const scroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  const session = await context.newCDPSession(page);
  const stick = await page.locator('[data-joystick]').boundingBox();
  const look = await page.locator('[data-look-zone]').boundingBox();
  const fire = await page.locator('[data-fire]').boundingBox();
  const joystick = { x: stick!.x + stick!.width / 2, y: stick!.y + stick!.height / 2, id: 1 };
  const camera = { x: look!.x + look!.width / 2, y: look!.y + 90, id: 2 };
  const trigger = { x: fire!.x + fire!.width / 2, y: fire!.y + fire!.height / 2, id: 3 };
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [joystick] });
  joystick.y -= 30;
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [joystick] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [joystick, camera] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [joystick, camera, trigger] });
  camera.x += 50; camera.y -= 20;
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [joystick, camera, trigger] });
  await page.waitForTimeout(280); // Actual held gesture duration, not a synthetic simulation step.
  // Chrome's native touch dispatch ends the listed contact, confirmed by observed pointerup IDs.
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [camera] });
  await expect(page.locator('[data-joystick] span')).toHaveAttribute('style', /translate/u);
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [joystick] });
  expect(await firePulse(page, true), 'Releasing movement/look must not stop the still-held fire finger').toBe(true);
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [trigger] });
  await expect(page.locator(rootSelector)).toHaveAttribute('data-firing', 'false');
  await page.getByRole('button', { name: 'Pausar partida' }).tap();
  const result = await readMap(page);
  expect(result.z).toBeLessThan(spawn.z - 0.2);
  expect(Math.abs(result.rotation - spawn.rotation)).toBeGreaterThan(3);
  expect(await page.evaluate(() => ({ x: scrollX, y: scrollY }))).toEqual(scroll);
  await session.detach();
});

test('mobile fire finger can aim while the movement finger stays active', async ({ page, context, isMobile }) => {
  test.skip(!isMobile, 'This scenario uses a real mobile fire-and-drag gesture.');
  await ready(page);
  const spawn = await readMap(page);
  await page.locator('[data-start]').tap();
  const session = await context.newCDPSession(page);
  const stick = await page.locator('[data-joystick]').boundingBox();
  const fire = await page.locator('[data-fire]').boundingBox();
  const joystick = { x: stick!.x + stick!.width / 2, y: stick!.y + stick!.height / 2, id: 1 };
  const trigger = { x: fire!.x + fire!.width / 2, y: fire!.y + fire!.height / 2, id: 2 };
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [joystick] });
  joystick.y -= 28;
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [joystick] });
  const pulse = firePulse(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [joystick, trigger] });
  trigger.x -= 55; trigger.y -= 20;
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [joystick, trigger] });
  expect(await pulse).toBe(true);
  await page.waitForTimeout(220);
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [trigger] });
  await expect(page.locator('[data-joystick] span')).toHaveAttribute('style', /translate/u);
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [joystick] });
  await page.getByRole('button', { name: 'Pausar partida' }).tap();
  const result = await readMap(page);
  expect(result.z).toBeLessThan(spawn.z - 0.2);
  expect(Math.abs(result.rotation - spawn.rotation)).toBeGreaterThan(3);
  await session.detach();
});

test('control picker exposes an explicit mouse or touch choice on either device', async ({ page, isMobile }) => {
  await ready(page);
  const mouse = page.locator('[data-control-mode="mouse"]');
  const touch = page.locator('[data-control-mode="touch"]');
  await expect(isMobile ? touch : mouse).toHaveAttribute('aria-pressed', 'true');
  await mouse.click();
  await expect(mouse).toHaveAttribute('aria-pressed', 'true');
  await expect(touch).toHaveAttribute('aria-pressed', 'false');
  await touch.click();
  await expect(touch).toHaveAttribute('aria-pressed', 'true');
  await expect(mouse).toHaveAttribute('aria-pressed', 'false');
  await page.locator('[data-start]').click();
  await expect(page.locator(rootSelector)).toHaveAttribute('data-screen', 'playing');
  await expect(page.locator(rootSelector)).toHaveAttribute('data-touch', 'true');
  await expect(page.locator('[data-fire]')).toBeVisible();
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();
});

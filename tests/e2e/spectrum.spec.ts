import { expect, test } from '@playwright/test';

const PROGRESS_KEY = 'psicoz:progress';

test('visual modes and palette respond to keyboard without audio, game or progress side effects', async ({ page }) => {
  const mediaRequests: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (request.resourceType() === 'media' || /(?:three(?:[./-]|$)|\/game\/|\.(?:mp3|wav|ogg|m4a|mp4|webm)(?:[?#]|$))/iu.test(request.url())) {
      mediaRequests.push(request.url());
    }
  });
  await page.goto('/#visual');
  const visual = page.locator('#visual');
  const stage = visual.locator('[data-spectrum]');
  const paths = visual.locator('#spectrum-art [data-spectrum-lines] path');
  const relief = visual.getByRole('button', { name: 'Relevo', exact: true });
  const lines = visual.getByRole('button', { name: 'Linhas', exact: true });
  const palette = visual.getByRole('button', { name: 'Cores do espectro', exact: true });
  const savedBefore = await page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY);
  expect(savedBefore).toBeNull();
  await expect(visual).toContainText('As formas são abstratas e não representam o áudio das faixas.');
  await expect(paths).toHaveCount(42);
  await expect(stage).toHaveAttribute('data-mode', 'relief');
  await expect(relief).toHaveAttribute('aria-pressed', 'true');
  await expect(lines).toHaveAttribute('aria-pressed', 'false');
  const initialFill = await paths.first().evaluate((path) => getComputedStyle(path).fill);
  await lines.focus();
  await page.keyboard.press('Enter');
  await expect(stage).toHaveAttribute('data-mode', 'lines');
  await expect(lines).toHaveAttribute('aria-pressed', 'true');
  await expect(relief).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => paths.first().evaluate((path) => getComputedStyle(path).fill)).not.toBe(initialFill);
  await relief.focus();
  await page.keyboard.press('Space');
  await expect(stage).toHaveAttribute('data-mode', 'relief');
  await expect(relief).toHaveAttribute('aria-pressed', 'true');
  await expect(paths.first()).toHaveCSS('fill', initialFill);

  const stops = visual.locator('#spectrum-art linearGradient stop');
  const initialColors = await stops.evaluateAll((elements) => elements.map((stop) => stop.getAttribute('stop-color')));
  expect(initialColors.length).toBeGreaterThan(1);
  await palette.focus();
  await page.keyboard.press('Space');
  await expect(stage).toHaveAttribute('data-palette', 'spectrum');
  await expect(palette).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => stops.evaluateAll((elements) => elements.map((stop) => stop.getAttribute('stop-color')))).not.toEqual(initialColors);
  await page.keyboard.press('Enter');
  await expect(stage).toHaveAttribute('data-palette', 'psicoz');
  await expect(palette).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => stops.evaluateAll((elements) => elements.map((stop) => stop.getAttribute('stop-color')))).toEqual(initialColors);
  await expect(page.locator('audio, video, canvas')).toHaveCount(0);
  await expect(page.locator('#collection-count')).toHaveText('0 de 15 faixas conquistadas no jogo');
  expect(await page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY)).toBe(savedBefore);
  expect(mediaRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('perspective keyboard changes SVG geometry within its declared bounds', async ({ page }) => {
  await page.goto('/#visual');
  const slider = page.getByRole('slider', { name: 'Perspectiva' });
  const paths = page.locator('#spectrum-art [data-spectrum-lines] path');
  await expect(paths).toHaveCount(42);
  await expect(slider).toHaveValue('0');
  const initialShape = await paths.first().getAttribute('d');
  expect(initialShape).toBeTruthy();
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('1');
  await expect(slider).toHaveAttribute('aria-valuetext', '1 graus');
  await expect.poll(() => paths.first().getAttribute('d')).not.toBe(initialShape);
  await page.keyboard.press('End');
  await expect(slider).toHaveValue('20');
  const rightShape = await paths.first().getAttribute('d');
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('20');
  await page.keyboard.press('Home');
  await expect(slider).toHaveValue('-20');
  await expect(slider).toHaveAttribute('aria-valuetext', '-20 graus');
  await expect.poll(() => paths.first().getAttribute('d')).not.toBe(rightShape);
  await page.keyboard.press('ArrowLeft');
  await expect(slider).toHaveValue('-20');
  const shapes = await paths.evaluateAll((elements) => elements.map((path) => path.getAttribute('d')));
  expect(shapes.every((shape) => shape !== null && shape.length > 0 && !/NaN|Infinity/u.test(shape))).toBe(true);
  expect(await page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY)).toBeNull();
});

test('visual controls stay usable without horizontal overflow at 320px', async ({ page, isMobile }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#visual');
  const visual = page.locator('#visual');
  await expect(visual).toBeInViewport();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  const controls = visual.locator('button, input[type="range"]');
  await expect(controls).toHaveCount(4);
  for (const control of await controls.all()) {
    await expect(control).toBeVisible();
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(321);
  }
  const lines = visual.getByRole('button', { name: 'Linhas', exact: true });
  if (isMobile) await lines.tap();
  else await lines.click();
  await expect(lines).toHaveAttribute('aria-pressed', 'true');
  const palette = visual.getByRole('button', { name: 'Cores do espectro', exact: true });
  if (isMobile) await palette.tap();
  else await palette.click();
  await expect(palette).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#tracklist > li')).toHaveCount(15);
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

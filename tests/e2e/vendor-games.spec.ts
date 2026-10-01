import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { VENDOR_GAMES } from '../../src/data/vendor-games';
const rootUrl = process.env.VENDOR_TEST_URL ?? '';
const captures = 'docs/screenshots/github-games-2026-09-30';
for (const game of VENDOR_GAMES) {
  test(`${game.trackId} runs its own ${game.slug} source and respects pause/exit`, async ({ page }, testInfo) => {
    const errors: string[] = [], external: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().includes('127.0.0.1')) external.push(request.url()); });
    await page.goto(`${rootUrl}/#/jogar/${game.trackId}`);
    await expect(page.locator('.vendor-game')).toHaveAttribute('data-screen', 'ready');
    await expect(page.locator('iframe')).toHaveCount(0);
    await page.getByRole('button', {name:'Jogar',exact:true}).click();
    await expect(page.locator('.vendor-game')).toHaveAttribute('data-screen', 'playing');
    await expect(page.locator('iframe')).toHaveAttribute('src',new RegExp(`/games/${game.slug}/index.html`));
    const child = page.frameLocator('iframe');
    await expect(child.locator('body')).toBeVisible();
    await mkdir(captures,{recursive:true});
    await page.screenshot({path:`${captures}/${testInfo.project.name}-${game.slug}.png`});
    expect(await child.locator('html').evaluate(el => el.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.getByRole('button',{name:'Pausar partida'}).click();
    await expect(page.locator('.vendor-game')).toHaveAttribute('data-screen','paused');
    const frozen = await child.locator('html').evaluate(() => ({now:performance.now(),clock:Date.now()}));
    await page.waitForTimeout(140);
    expect(await child.locator('html').evaluate(() => ({now:performance.now(),clock:Date.now()}))).toEqual(frozen);
    const before = await page.locator('iframe').getAttribute('src');
    await page.getByRole('button',{name:'Recomeçar fase'}).click();
    await expect(page.locator('.vendor-game')).toHaveAttribute('data-screen','playing');
    expect(await page.locator('iframe').getAttribute('src')).not.toBe(before);
    await page.getByRole('button',{name:'Fechar jogo'}).click();
    await expect(page.locator('iframe')).toHaveCount(0);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('psicoz:progress') ?? '{}').completedLevelIds ?? [])).toEqual([]);
    expect(external).toEqual([]); expect(errors).toEqual([]);
  });
}
test('ignores unauthenticated progress messages and grants NFC access without a win',async({page})=>{
  await page.goto(`${rootUrl}/#/jogar/track-08`);
  await page.getByRole('button',{name:'Jogar',exact:true}).click();
  await expect(page.locator('.vendor-game')).toHaveAttribute('data-screen','playing');
  await page.evaluate(()=>window.postMessage({type:'psicoz-game',token:'fake',phase:'won',progress:2,total:2},location.origin));
  await expect(page.locator('.vendor-game')).toHaveAttribute('data-screen','playing');
  await page.goto(`${rootUrl}/?edition=nfc`);
  await expect(page.locator('#game-progress-count')).toContainText('0 / 15');
  const state = await page.evaluate(()=>JSON.parse(localStorage.getItem('psicoz:progress')!));
  expect(state.nfcUnlocked).toBe(true); expect(state.completedLevelIds).toEqual([]);
});
test('Untangle is won through actual node movements, then saved and reloaded',async({page})=>{
  await page.goto(`${rootUrl}/#/jogar/track-08`);
  await page.getByRole('button',{name:'Jogar',exact:true}).click();
  await expect(page.locator('.vendor-game')).toHaveAttribute('data-screen','playing');
  const child = page.frameLocator('iframe');
  const canvas = child.locator('canvas');
  async function drag(x1:number,y1:number,x2:number,y2:number){
    const rect = await canvas.boundingBox();
    await page.mouse.move(rect!.x+x1/600*rect!.width,rect!.y+y1/360*rect!.height);
    await page.mouse.down();
    await page.mouse.move(rect!.x+x2/600*rect!.width,rect!.y+y2/360*rect!.height,{steps:8});
    await page.mouse.up();
  }
  // Read the authored visible geometry: lift node 2 above the two crossing edges.
  await drag(381,241,250,60);
  await expect(page.locator('[data-progress]')).toHaveText('REDES LIVRES 1 / 2');
  // Stage 2 is K4: the fourth vertex lies inside the triangle formed by the other three.
  await drag(84,72,300,190);
  await expect(page.locator('.vendor-game')).toHaveAttribute('data-screen','won');
  await expect(page.locator('[data-result]')).toContainText('Conquista salva');
  const state = await page.evaluate(()=>JSON.parse(localStorage.getItem('psicoz:progress')!));
  expect(state.completedLevelIds).toEqual(['level-08']); expect(state.unlockedTrackIds).toEqual(['track-08']);
  await page.getByRole('button',{name:'Ver minha coleção'}).click();
  await page.reload();
  await expect(page.locator('[data-game-track="track-08"]')).toHaveAttribute('data-recovered','true');
  await expect(page.locator('a[download]')).toHaveCount(0);
});

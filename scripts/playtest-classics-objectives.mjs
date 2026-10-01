// Uses real browser input only; game snapshots are read to navigate visible geometry.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1200, height: 850 } });
const results = [];
await mkdir('output/playtest/classics-misc', { recursive: true });
async function setup(track, slug) {
  const page = await context.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:4174/#/jogar/track-${track}`);
  await page.locator('[data-start]').click();
  await page.locator('.vendor-game[data-screen="playing"]').waitFor();
  return { page, frame: page.frames().find(frame => frame.url().includes(`/games/${slug}/`)), errors };
}
try {
  // Maze path is derived from the same visible wall grid; only arrow key presses move the player.
  const { page, frame, errors } = await setup('01', 'maze');
  const visible = await frame.evaluate(() => ({ maze, finish, player: { x: Math.floor(player.x), y: Math.floor(player.y) } }));
  const queue = [[visible.player, []]], seen = new Set(); let route;
  while (queue.length) {
    const [point, path] = queue.shift(), key = `${point.x},${point.y}`;
    if (seen.has(key)) continue; seen.add(key);
    if (point.x === visible.finish.x && point.y === visible.finish.y) { route = path; break; }
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const next = { x: point.x + dx, y: point.y + dy };
      if (visible.maze[next.y]?.[next.x] === 0) queue.push([next, [...path, next]]);
    }
  }
  if (!route?.length) throw new Error('Maze exit is not reachable or is already the start');
  await frame.locator('[data-key="ArrowRight"]').focus();
  let previous = visible.player;
  for (const point of route) {
    const dx = point.x - previous.x, dy = point.y - previous.y;
    const key = dx > 0 ? 'ArrowRight' : dx < 0 ? 'ArrowLeft' : dy > 0 ? 'ArrowDown' : 'ArrowUp';
    await page.keyboard.down(key);
    for (let attempt = 0; attempt < 100; attempt++) {
      const location = await frame.evaluate(() => ({ x: player.x, y: player.y, won: gameFinished }));
      if (location.won || (dx ? dx > 0 ? location.x >= point.x + .25 : location.x <= point.x + .25 : dy > 0 ? location.y >= point.y + .25 : location.y <= point.y + .25)) break;
      await page.waitForTimeout(20);
    }
    await page.keyboard.up(key); previous = point;
  }
  await page.locator('.vendor-game[data-screen="won"]').waitFor({timeout:3000});
  await page.screenshot({path:'output/playtest/classics-misc/maze-real-win.png'});
  results.push({game:'maze',result:'won through arrow inputs',pathLength:route.length,errors});await page.close();

  // Simon: record only the classes shown on the visible symbol buttons.
  const simon = await setup('14','simon');
  for (let round=1;round<=4;round++) {
    const pattern=[];let last=-1;
    for(let sample=0;sample<300;sample++) {
      const active=await simon.frame.locator('.simon-button').evaluateAll(buttons=>buttons.findIndex(button=>button.classList.contains('active')));
      if(active>=0&&active!==last)pattern.push(active);last=active;
      if((await simon.frame.locator('#instruction').textContent()).startsWith('SUA VEZ'))break;
      await simon.page.waitForTimeout(25);
    }
    if(pattern.length!==round)throw new Error(`Simon visible pattern length${pattern.length}, expected${round}`);
    for(const index of pattern)await simon.frame.locator(`[data-index="${index}"]`).click();
    if(round<4)await simon.page.waitForTimeout(250);
  }
  await simon.page.locator('.vendor-game[data-screen="won"]').waitFor({timeout:3000});
  await simon.page.screenshot({path:'output/playtest/classics-misc/simon-real-win.png'});
  results.push({game:'simon',result:'won through four visible sequences',errors:simon.errors});await simon.page.close();

  const flappy=await setup('03','flappy');
  await flappy.page.locator('.vendor-game[data-screen="lost"]').waitFor({timeout:8000});
  results.push({game:'flappy',result:'idle loses, no free victory',errors:flappy.errors});await flappy.page.close();

  const invaders=await setup('12','invaders');
  await invaders.page.keyboard.down('Space');
  const field=invaders.frame.locator('canvas'),bounds=await field.boundingBox();
  for(let sample=0;sample<70;sample++) {
    const snapshot=await invaders.frame.evaluate(()=>{const s=game.currentState();return {score:game.score,target:s.invaders?.[s.invaders.length-1]?.x,width:game.width}});
    if(snapshot.score>0)break;
    if(snapshot.target!==undefined)await invaders.page.mouse.move(bounds.x+snapshot.target/snapshot.width*bounds.width,bounds.y+bounds.height*.8);
    await invaders.page.waitForTimeout(60);
  }
  await invaders.page.keyboard.up('Space');
  const score=await invaders.frame.evaluate(()=>game.score);
  if(score<=0)throw new Error('Real invaders firing did not hit a target');
  results.push({game:'invaders',result:'real projectile hit',score,errors:invaders.errors});await invaders.page.close();
} finally {
  await writeFile('output/playtest/classics-misc/objectives.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
  await context.close();await browser.close();
}

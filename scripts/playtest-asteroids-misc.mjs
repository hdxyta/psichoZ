// Observes visible sprite geometry and sends actual mouse/keyboard inputs; no state writes.
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1200,height:850}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
let result;
try {
  await page.goto('http://127.0.0.1:4174/#/jogar/track-09');
  await page.locator('[data-start]').click();
  await page.locator('.vendor-game[data-screen="playing"]').waitFor();
  const frame=page.frames().find(f=>f.url().includes('/games/asteroids/'));
  const bounds=await frame.locator('canvas').boundingBox();
  await page.mouse.move(bounds.x+bounds.width*.5,bounds.y+bounds.height*.4);
  await page.mouse.down();
  let sawFragments=false,score=0;
  for(let i=0;i<600;i++) {
    const snapshot=await frame.evaluate(()=>({score:Game.score,phase:Game.FSM.state,ship:{x:Game.ship.x,y:Game.ship.y},asteroids:Game.sprites.filter(s=>s.name==='asteroid'&&s.visible).map(s=>({x:s.x,y:s.y,scale:s.scale,vx:s.vel.x,vy:s.vel.y}))}));
    score=snapshot.score;sawFragments ||= snapshot.asteroids.some(s=>s.scale<6);
    if(['recovered','end_game'].includes(snapshot.phase))break;
    const target=snapshot.asteroids.sort((a,b)=>Math.hypot(a.x-snapshot.ship.x,a.y-snapshot.ship.y)-Math.hypot(b.x-snapshot.ship.x,b.y-snapshot.ship.y))[0];
    if(target){
      const lead=Math.hypot(target.x-snapshot.ship.x,target.y-snapshot.ship.y)/6;
      await page.mouse.move(bounds.x+(target.x+target.vx*lead)/960*bounds.width,bounds.y+(target.y+target.vy*lead)/600*bounds.height);
    }
    await page.waitForTimeout(35);
  }
  await page.mouse.up();
  const phase=await page.locator('.vendor-game').getAttribute('data-screen');
  result={game:'asteroids',phase,score,sawFragments,errors};
  if(score<=0||!sawFragments||errors.length)throw new Error(JSON.stringify(result));
  await page.screenshot({path:'output/playtest/classics-misc/asteroids-real-input.png'});
} finally {
  await writeFile('output/playtest/classics-misc/asteroids-input.json',JSON.stringify(result??{errors},null,2));
  console.log(JSON.stringify(result??{errors},null,2));
  await browser.close();
}

import {test,expect} from '@playwright/test';

test('freira anda, vira, atira, defende e pula',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/games/brawler/index.html');
  await page.locator('[data-fighter="nun"]').click();
  const canvas=page.locator('#brawler-canvas');
  await expect(canvas).toHaveAttribute('data-player-state','idle');
  await page.keyboard.down('KeyA');
  await expect(canvas).toHaveAttribute('data-player-state','walk');
  await expect(canvas).toHaveAttribute('data-facing','-1');
  await page.keyboard.press('KeyJ');
  await expect(canvas).toHaveAttribute('data-player-state','run-fire');
  await page.keyboard.up('KeyA');
  await expect(canvas).toHaveAttribute('data-projectiles',/[1-9]/);
  await page.waitForTimeout(650);
  await page.keyboard.down('KeyL');await expect(canvas).toHaveAttribute('data-player-state','guard');
  await page.keyboard.up('KeyL');await page.keyboard.press('Space');
  await expect(canvas).toHaveAttribute('data-player-state','jump');
  await page.screenshot({path:`test-results/silencio-nun-${test.info().project.name}.png`});
  expect(errors).toEqual([]);
});

test('especial lança uma granada que explode; controles por toque',async({page})=>{
  await page.goto('/games/brawler/index.html');
  await page.locator('[data-fighter="nun"]').click();
  const canvas=page.locator('#brawler-canvas');
  if(test.info().project.name==='mobile')await page.locator('[data-tap="KeyK"]').tap();
  else await page.locator('[data-tap="KeyK"]').click();
  await expect(canvas).toHaveAttribute('data-player-state','special');
  await expect(canvas).toHaveAttribute('data-grenades','1');
  await expect(canvas).toHaveAttribute('data-explosions','1',{timeout:3000});
  await expect(canvas).toHaveAttribute('data-grenades','0');
  await page.screenshot({path:`test-results/silencio-nun-explosion-${test.info().project.name}.png`});
});

test('tiro funciona à distância mesmo sem sprites',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/nun-*.webp',route=>route.abort());
  await page.goto('/games/brawler/index.html');
  await page.locator('[data-fighter="nun"]').click();
  const canvas=page.locator('#brawler-canvas');
  const hp=Number(await canvas.getAttribute('data-enemy-hp'));
  await page.locator('[data-tap="KeyJ"]').click();
  await expect.poll(async()=>Number(await canvas.getAttribute('data-enemy-hp'))).toBeLessThan(hp);
  expect(errors).toEqual([]);
});

test('revisão visual das animações e dos efeitos da freira',async({page})=>{
  await page.goto('/games/brawler/index.html');
  await page.evaluate(async()=>{
    const names=['walk','attack','run-fire','guard','special','jump','shot','explosion'];
    await Promise.all(names.map(name=>new Promise<void>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve();img.onerror=reject;img.src=`nun-${name}.webp`;})));
    const c=document.createElement('canvas');c.id='nun-atlas';c.width=1600;c.height=1600;c.style.position='relative';c.style.zIndex='2';document.body.append(c);document.body.style.overflow='auto';
    const ctx=c.getContext('2d')!;ctx.fillStyle='#24191e';ctx.fillRect(0,0,c.width,c.height);
    names.forEach((name,row)=>{
      for(let i=0;i<8;i++){
        const f={x:i*195+60,y:row*195+80,w:44,h:72,facing:1,grounded:true,vx:0,attack:0,special:0,guarding:false,guardTime:0,blocked:0,walkDistance:0,landing:0,hurt:0,vy:0,jumpTime:1};
        if(name==='walk'){f.vx=30;f.walkDistance=i*13;}
        if(name==='attack'||name==='run-fire'){f.attack=.56-(i+.1)*.07;f.vx=name==='run-fire'?40:0;}
        if(name==='special')f.special=.8-(i+.1)*.1;
        if(name==='guard'){f.guarding=true;f.guardTime=i/14;f.blocked=i===3?.1:0;}
        if(name==='jump'){f.grounded=i===6;f.landing=i===6?.1:0;f.jumpTime=i===0?.01:i===1?.08:1;f.vy=i<3?-400:i<5?0:400;}
        const api=(window as any).SilencioNun;
        if(name==='shot')api.drawShot(ctx,f.x,f.y+20,(i+.1)*.045,1);
        else if(name==='explosion')api.drawExplosion(ctx,f.x,f.y+20,(i+.1)*.075);
        else api.draw(ctx,f);
        ctx.fillStyle='#fff';ctx.font='16px monospace';ctx.fillText(`${name} ${i}`,i*195+10,row*195+190);
      }
    });
  });
  await page.locator('#nun-atlas').screenshot({path:`test-results/silencio-nun-atlas-${test.info().project.name}.png`});
});

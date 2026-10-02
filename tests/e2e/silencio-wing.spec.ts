import {test,expect} from '@playwright/test';
test('anjo responde a movimento, magia, defesa, pulo e toque',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/games/brawler/index.html');await page.locator('[data-fighter="wing"]').click();
  const canvas=page.locator('#brawler-canvas');await expect(canvas).toHaveAttribute('data-player-state','idle');
  await page.keyboard.down('KeyA');await expect(canvas).toHaveAttribute('data-player-state','walk');
  await expect(canvas).toHaveAttribute('data-facing','-1');await page.keyboard.up('KeyA');
  await page.keyboard.press('KeyJ');await expect(canvas).toHaveAttribute('data-player-state','attack');
  await expect(canvas).toHaveAttribute('data-magic','1');
  await page.waitForTimeout(700);await page.keyboard.down('KeyL');await expect(canvas).toHaveAttribute('data-player-state','guard');
  await page.keyboard.up('KeyL');
  if(test.info().project.name==='mobile')await page.locator('[data-tap="Space"]').tap();else await page.locator('[data-tap="Space"]').click();
  await expect(canvas).toHaveAttribute('data-player-state','jump');expect(errors).toEqual([]);
  await page.screenshot({path:`test-results/silencio-wing-${test.info().project.name}.png`});
});
test('especial cria fogo no solo e termina após dissipar',async({page})=>{
  await page.goto('/games/brawler/index.html');await page.locator('[data-fighter="wing"]').click();
  const canvas=page.locator('#brawler-canvas');
  if(test.info().project.name==='mobile')await page.locator('[data-tap="KeyK"]').tap();else await page.locator('[data-tap="KeyK"]').click();
  await expect(canvas).toHaveAttribute('data-player-state','special');await expect(canvas).toHaveAttribute('data-flames','1');
  await page.waitForTimeout(450);await page.screenshot({path:`test-results/silencio-wing-fire-${test.info().project.name}.png`});
  await expect(canvas).toHaveAttribute('data-flames','0');
});
test('a magia causa dano mesmo sem imagens',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/wing-*.webp',r=>r.abort());
  await page.goto('/games/brawler/index.html');await page.locator('[data-fighter="wing"]').click();
  const canvas=page.locator('#brawler-canvas');const hp=Number(await canvas.getAttribute('data-enemy-hp'));
  await page.locator('[data-tap="KeyJ"]').click();await expect.poll(async()=>Number(await canvas.getAttribute('data-enemy-hp'))).toBeLessThan(hp);
  expect(errors).toEqual([]);
});
test('atlas de revisão das poses e efeitos do anjo',async({page})=>{
  await page.goto('/games/brawler/index.html');
  await page.evaluate(async()=>{
    const names=['walk','jump','attack','guard','special','magic','fire'];
    await Promise.all(names.map(name=>new Promise<void>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve();img.onerror=reject;img.src=`wing-${name}.webp`;})));
    const c=document.createElement('canvas');c.id='wing-atlas';c.width=1600;c.height=1400;c.style.position='relative';c.style.zIndex='2';document.body.append(c);document.body.style.overflow='auto';
    const ctx=c.getContext('2d')!;ctx.fillStyle='#24191e';ctx.fillRect(0,0,c.width,c.height);
    names.forEach((name,row)=>{for(let i=0;i<8;i++){
      const f={x:i*195+90,y:row*195+75,w:44,h:72,facing:1,grounded:true,vx:0,attack:0,special:0,guarding:false,guardTime:0,blocked:0,walkDistance:0,landing:0,hurt:0,vy:0,jumpTime:1};
      if(name==='walk'){f.vx=30;f.walkDistance=i*14;}
      if(name==='attack')f.attack=.64-(i+.1)*.08;
      if(name==='special')f.special=.96-(i+.1)*.12;
      if(name==='guard'){f.guarding=true;f.guardTime=i/13;f.blocked=i===4?.1:0;}
      if(name==='jump'){f.grounded=i===7;f.landing=i===7?.1:0;f.jumpTime=i===0?.01:i===1?.08:1;f.vy=i<3?-400:i<5?0:400;}
      const api=(window as any).SilencioWing;
      if(name==='magic')api.drawMagic(ctx,{x:f.x,y:f.y+35,age:(i<6?i+.1:i-6+.1)*(i<6?.055:.1),facing:1,impact:i>=6});
      else if(name==='fire')api.drawFire(ctx,{x:f.x,y:f.y+85,age:(i+.1)*.1});
      else api.draw(ctx,f);
      ctx.fillStyle='#fff';ctx.font='16px monospace';ctx.fillText(`${name} ${i}`,i*195+10,row*195+190);
    }});
  });
  await page.locator('#wing-atlas').screenshot({path:`test-results/silencio-wing-atlas-${test.info().project.name}.png`});
});

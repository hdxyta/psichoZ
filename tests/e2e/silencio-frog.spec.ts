import {test,expect} from '@playwright/test';
test('botões mantidos liberam movimento e defesa ao soltar',async({page})=>{
  await page.goto('/games/brawler/index.html');
  await page.locator('[data-fighter="frog"]').click();
  const canvas=page.locator('#brawler-canvas');
  await expect(canvas).toHaveAttribute('data-player-state','idle');
  const left=await page.locator('[data-hold="KeyA"]').boundingBox();
  await page.mouse.move(left!.x+left!.width/2,left!.y+left!.height/2);await page.mouse.down();
  await expect(canvas).toHaveAttribute('data-player-state','walk');
  await page.mouse.move(1,1);await page.mouse.up();
  await expect(canvas).toHaveAttribute('data-player-state','idle');
  const guard=await page.locator('[data-hold="KeyL"]').boundingBox();
  await page.mouse.move(guard!.x+guard!.width/2,guard!.y+guard!.height/2);await page.mouse.down();
  await expect(canvas).toHaveAttribute('data-player-state','guard');
  await page.mouse.up();await expect(canvas).toHaveAttribute('data-player-state','idle');
  await page.locator('[data-tap="Space"]').click();await expect(canvas).toHaveAttribute('data-player-state','jump');
});
test('sapo mantém controles quando os sprites faltam',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/frog-*.webp',route=>route.abort());
  await page.goto('/games/brawler/index.html');
  await page.locator('[data-fighter="frog"]').click();
  await page.locator('[data-tap="KeyJ"]').click();
  await expect(page.locator('#brawler-canvas')).toHaveAttribute('data-player-state','attack');
  expect(errors).toEqual([]);
});
test('sapo responde a direção, defesa, pulo e golpes',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/games/brawler/index.html');
  await page.keyboard.press('Space');
  await page.locator('[data-fighter="frog"]').click();
  const canvas=page.locator('#brawler-canvas');
  await expect(canvas).toHaveAttribute('data-player-state','idle');
  await page.keyboard.down('KeyA');
  await expect(canvas).toHaveAttribute('data-player-state','walk');
  await expect(canvas).toHaveAttribute('data-facing','-1');
  await page.keyboard.up('KeyA');
  await page.keyboard.down('KeyL');
  await expect(canvas).toHaveAttribute('data-player-state','guard');
  await page.keyboard.up('KeyL');
  await expect(canvas).not.toHaveAttribute('data-player-state','guard');
  await page.keyboard.press('KeyJ');
  await expect(canvas).toHaveAttribute('data-player-state','attack');
  await page.screenshot({path:`test-results/silencio-frog-${test.info().project.name}.png`});
  await page.waitForTimeout(650);
  await page.keyboard.press('KeyK');
  await expect(canvas).toHaveAttribute('data-player-state','special');
  await page.waitForTimeout(1000);
  await page.keyboard.press('Space');
  await expect(canvas).toHaveAttribute('data-player-state','jump');
  expect(errors).toEqual([]);
});
test('atlas visual de todos os quadros do sapo',async({page})=>{
  await page.goto('/games/brawler/index.html');
  await page.evaluate(async()=>{
    const names=['walk','attack','combo','guard','special','jump'];
    await Promise.all(names.map(name=>new Promise<void>(resolve=>{const i=new Image();i.onload=()=>resolve();i.src=`frog-${name}.webp`;})));
    const c=document.createElement('canvas');c.id='frog-atlas';c.width=2000;c.height=1200;document.body.append(c);document.body.style.overflow='auto';
    const ctx=c.getContext('2d')!;ctx.fillStyle='#24191e';ctx.fillRect(0,0,2000,1200);
    names.forEach((name,row)=>{
      const count=name==='special'?10:name==='guard'?6:8;
      for(let i=0;i<count;i++){
        const f={x:i*195+40,y:row*195+100,w:44,h:72,facing:1,grounded:true,vx:0,attack:0,special:0,combo:0,guarding:false,guardTime:0,blocked:0,walkDistance:0,landing:0,hurt:0,vy:0,jumpTime:1};
        if(name==='walk'){f.vx=30;f.walkDistance=i*14;}
        if(name==='attack'||name==='combo'){f.attack=.56*(1-(i+.1)/8);f.combo=name==='combo'?1:0;}
        if(name==='special')f.special=.9*(1-(i+.1)/10);
        if(name==='guard'){f.guarding=true;f.guardTime=i/12;f.blocked=i===3?.1:0;}
        if(name==='jump'){f.grounded=false;f.vy=i<3?-400:i<5?0:400;f.jumpTime=i===1?.01:1;}
        (window as any).SilencioFrog.draw(ctx,f);
        ctx.fillStyle='#fff';ctx.font='16px monospace';ctx.fillText(`${name} ${i}`,i*195+10,row*195+190);
      }
    });
  });
  await page.locator('#frog-atlas').screenshot({path:`test-results/silencio-atlas-${test.info().project.name}.png`});
});

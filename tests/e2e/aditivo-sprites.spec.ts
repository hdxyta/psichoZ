import { test, expect } from '@playwright/test';

test('contato real com zumbi mostra moldura com fade',async({page})=>{
  await page.addInitScript(()=>{
    const original=CanvasRenderingContext2D.prototype.drawImage;
    (window as any).damageAlphas=[];
    CanvasRenderingContext2D.prototype.drawImage=function(this:CanvasRenderingContext2D,...args:any[]){
      if(args[0] instanceof HTMLImageElement && args[0].src.includes('damage-frame')) (window as any).damageAlphas.push(this.globalAlpha);
      return (original as any).apply(this,args);
    } as any;
  });
  await page.goto('/games/zombie/index.html');
  await page.locator('[data-cards] button').first().click();
  await page.waitForFunction(()=>(window as any).damageAlphas.length>12,{},{timeout:20000});
  const alphas=await page.evaluate(()=>(window as any).damageAlphas as number[]);
  expect(Math.max(...alphas)).toBeGreaterThan(.3);
  expect(alphas.some((a,i)=>i>0 && a<alphas[i-1])).toBe(true);
  await page.screenshot({path:`test-results/aditivo-damage-${test.info().project.name}.png`});
});

test('Aditivo carrega sprites e mantém a arena proporcional', async ({ page }) => {
  await page.goto('/games/zombie/index.html');
  const canvas = page.locator('#zombie-canvas');
  await expect(canvas).toHaveAttribute('data-sprites', 'ready');
  await expect(canvas).toHaveAttribute('data-map', 'ready');
  await page.locator('[data-cards] button').first().click();
  await expect(page.locator('[data-cards]')).toBeHidden();
  await page.waitForTimeout(4000);
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  expect(Math.abs((box!.width-4)/(box!.height-4)-16/9)).toBeLessThan(.03);
  expect(box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({ path: `test-results/aditivo-${test.info().project.name}.png` });
});

test('Aditivo continua jogável se a imagem falhar', async ({ page }) => {
  await page.route('**/zombies-neon.png', route => route.abort());
  await page.route('**/cemetery.webp', route => route.abort());
  await page.goto('/games/zombie/index.html');
  await expect(page.locator('#zombie-canvas')).toHaveAttribute('data-sprites', 'fallback');
  await expect(page.locator('#zombie-canvas')).toHaveAttribute('data-map', 'fallback');
  await page.locator('[data-cards] button').first().click();
  await expect(page.locator('[data-game-status]')).toContainText('Round 1');
});

test('Freira começa desarmada e só equipa faca ao coletar', async ({page}) => {
  const errors: string[]=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/games/zombie/index.html');
  const canvas=page.locator('#zombie-canvas');
  await expect(canvas).toHaveAttribute('data-weapon','none');
  await expect(canvas).toHaveAttribute('data-drop','');
  await page.locator('[data-cards] button').first().click();
  await expect(canvas).toHaveAttribute('data-cards-chosen','1');
  await expect(canvas).toHaveAttribute('data-drop','knife');
  await expect(canvas).toHaveAttribute('data-weapon','none');
  await page.waitForTimeout(850);
  await page.screenshot({path:`test-results/freira-drop-${test.info().project.name}.png`});
  const right=page.locator('[data-key="KeyD"]');
  const bounds=await right.boundingBox();
  await page.mouse.move(bounds!.x+bounds!.width/2,bounds!.y+bounds!.height/2);
  await page.mouse.down();
  await expect(canvas).toHaveAttribute('data-weapon','knife',{timeout:2500});
  await page.mouse.up();
  await expect(canvas).toHaveAttribute('data-drop','');
  await page.screenshot({path:`test-results/freira-knife-${test.info().project.name}.png`});
  expect(errors).toEqual([]);
});

test('atlas visual das armas e direções sem alterar a partida',async ({page})=>{
  await page.goto('/games/zombie/index.html');
  await page.evaluate(async()=>{
    await Promise.all(['nun','knife','shotgun','staff','fx-knife','fx-shotgun','fx-staff'].map(name=>new Promise<void>(resolve=>{const i=new Image();i.onload=()=>resolve();i.src=`${name}.webp`;})));
    const c=document.createElement('canvas');c.id='art-review';c.width=800;c.height=480;document.body.append(c);
    const ctx=c.getContext('2d')!;ctx.fillStyle='#10090b';ctx.fillRect(0,0,800,480);
    const art=(window as any).AditivoArt;
    [null,'knife','shotgun','staff'].forEach((weapon,row)=>{
      ['down','left','right','up'].forEach((facing,col)=>{
        ctx.fillStyle='#fff';ctx.font='14px monospace';ctx.fillText(`${weapon||'sem arma'} / ${facing}`,col*195+10,row*115+20);
        art.drawPlayer(ctx,{weapon,facing,x:col*195+80,y:row*115+80,moving:true,anim:.25,attack:0});
        if(weapon) art.effect(ctx,weapon,col*195+145,row*115+75,0,.25);
      });
    });
  });
  await page.locator('#art-review').screenshot({path:`test-results/freira-atlas-${test.info().project.name}.png`});
});

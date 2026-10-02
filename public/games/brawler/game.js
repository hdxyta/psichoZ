(() => {
  'use strict';
  const canvas = document.getElementById('brawler-canvas');
  const ctx = canvas.getContext('2d');
  const status = document.querySelector('[data-game-status]');
  const select = document.querySelector('[data-select]');
  const W = canvas.width, H = canvas.height, gravity = 1700, floor = 486, roundsToWin = 3;
  const keys = new Set();
  const effects = [];
  const nunCombat = window.SilencioNunCombat.create();
  const wingCombat = window.SilencioWingCombat.create();
  let player, enemy, round = 0, ended = false, recovered = false, selected = null, last = performance.now(), loopId;
  const fighters = {
    frog: {name:'Sapo Chifrudo',hp:125,speed:235,jump:690,power:20,reach:72,color:'#f5eee4'},
    scorpion: {name:'Escorpião Monstruoso',hp:135,speed:215,jump:650,power:22,reach:80,color:'#f5eee4'},
    wing: { name:'Anjo Rasgado', hp:112, speed:250, jump:720, power:18, reach:300, color:'#f5eee4' },
    nun: { name:'Freira Armada', hp:115, speed:225, jump:660, power:22, reach:300, color:'#f5eee4' },
    eye: { name:'Olho Febril', hp:96, speed:292, jump:680, power:15, reach:64, color:'#f5eee4' },
  };
  const roster = ['frog','scorpion','wing','nun','eye'];
  const platforms = [
    {x:0,y:floor,w:W,h:34}, {x:116,y:360,w:220,h:18}, {x:624,y:360,w:220,h:18}, {x:358,y:266,w:244,h:18}, {x:48,y:190,w:150,h:16}, {x:762,y:190,w:150,h:16}
  ];
  function report(phase, hint) {
    const progress = Math.min(round, roundsToWin);
    status.textContent = `ROUND ${progress} / ${roundsToWin} · ${hint}`;
    window.PsicoZ?.report({ phase, progress, total: roundsToWin, label:'ROUND', hint });
  }
  function makeFighter(kind, side) {
    const base = fighters[kind];
    return { kind, side, x: side === 1 ? 210 : 750, y: floor - 72, vx:0, vy:0, w:44, h:72, hp:base.hp, maxHp:base.hp, facing: side, grounded:false, jumps:0, attack:0, special:0, hurt:0, cooldown:0, ai:0, score:0, combo:-1, struck:false, guarding:false,guardTime:0,blocked:0,walkDistance:0,jumpTime:0,landing:0, ...base };
  }
  function begin(kind) {
    selected = kind; select.hidden = true; round = 0; recovered = false; nextRound();
  }
  function nextRound() {
    nunCombat.clear();wingCombat.clear();effects.length=0;
    round += 1;
    const enemyKind = roster[(roster.indexOf(selected) + round) % roster.length];
    player = makeFighter(selected, 1); enemy = makeFighter(enemyKind, -1);
    enemy.hp += round * 10; enemy.maxHp = enemy.hp; enemy.power += round * 2;
    report('playing', `Derrube ${enemy.name}.`);
  }
  function end(won) { if (won) { recovered = true; report('won', 'Silêncio quebrado. Ringue recuperado. Continue lutando se quiser.'); nextRound(); return; } ended = true; report('lost', 'O silêncio engoliu o ringue.'); }
  function rects(a,b){ return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function attackBox(f, special=false) { const reach = special ? f.reach + 42 : f.reach; return {x:f.facing > 0 ? f.x + f.w - 6 : f.x - reach + 6, y:f.y + (special ? 10 : 18), w:reach, h:special ? 42 : 34}; }
  function strike(attacker, target, special=false) {
    if(attacker.kind==='nun'||attacker.kind==='wing')return;
    if ((special && attacker.special <= 0) || (!special && attacker.attack <= 0)) return;
    if(attacker.kind==='frog' || attacker.kind==='scorpion') {
      const elapsed=special?.9-attacker.special:.56-attacker.attack;
      const impactStart=special?(attacker.kind==='scorpion'?.5:.3):.18;
      const impactEnd=special?(attacker.kind==='scorpion'?.74:.64):.4;
      if(attacker.struck || elapsed<impactStart || elapsed>impactEnd)return;
    }
    const box = attackBox(attacker, special);
    if (!rects(box, target) || target.hurt > 0) return;
    attacker.struck=true;
    damageFighter(attacker,target,special?attacker.power+18:attacker.power,attacker.facing,special);
  }
  function damageFighter(attacker,target,damage,direction,special) {
    if(target.hurt>0)return;
    const blocking=target.guarding && target.facing===-direction;
    target.hp -= damage*(blocking?.25:1); target.hurt = blocking?.14:attacker.kind==='nun'&&!special?.12:.34; target.vx = direction * (blocking?90:special ? 620 : 420); target.vy = blocking?0:special ? -430 : -270;
    if(blocking)target.blocked=.2;
    effects.push({x:target.x+target.w/2,y:target.y+target.h/2,life:.22,big:special});
  }
  function startAttack(f, special=false) {
    if(!f || ended || window.PsicoZ?.paused || f.guarding || f.attack>0 || f.special>0 || f.hurt>0)return;
    f.struck=false;
    if(f.kind==='wing'){
      if(f.cooldown>0)return;
      if(special){f.special=.96;f.cooldown=1.8;}else{f.attack=.64;f.cooldown=.72;}
      return;
    }
    if(f.kind==='nun'){
      if(f.cooldown>0)return;
      f.shotsFired=0;f.fireMoving=f.grounded&&Math.abs(f.vx)>12;
      if(special){f.special=.8;f.cooldown=1.65;}else{f.attack=.56;f.cooldown=.64;}
      return;
    }
    if(f.kind==='frog' || f.kind==='scorpion') {
      if(f.cooldown>0)return;
      if(special){f.special=.9;f.cooldown=1.4;}else{f.attack=.56;f.cooldown=.6;f.combo++;}
      return;
    }
    if (special) { if (f.cooldown <= 0) { f.special = .22; f.cooldown = 1.1; } }
    else if (f.attack <= 0) { f.attack = .18; f.cooldown = Math.max(f.cooldown,.18); }
  }
  function jump(f) { if (!f || ended || window.PsicoZ?.paused || f.guarding)return; if (f.grounded || f.jumps < 2) { f.vy = -f.jump; f.grounded = false; f.jumps += 1; f.jumpTime=0; } }
  function platformCollision(f, prevY) {
    f.grounded = false;
    for (const p of platforms) {
      if (f.x + f.w < p.x || f.x > p.x + p.w) continue;
      if (prevY + f.h <= p.y && f.y + f.h >= p.y && f.vy >= 0) {
        f.y = p.y - f.h; f.vy = 0; f.grounded = true; f.jumps = 0;
      }
    }
    if (f.x < 0) { f.x = 0; f.vx = Math.max(0, f.vx); }
    if (f.x + f.w > W) { f.x = W - f.w; f.vx = Math.min(0, f.vx); }
  }
  function updateFighter(f, dt, control) {
    const prevY = f.y,prevX=f.x,wasGrounded=f.grounded;
    f.guarding=Boolean(control.guard && f.grounded && !f.attack && !f.special);
    f.guardTime=f.guarding?f.guardTime+dt:0;f.blocked=Math.max(0,f.blocked-dt);
    f.landing=Math.max(0,f.landing-dt);if(!f.grounded)f.jumpTime+=dt;
    const move = control.move*(f.guarding?.2:(f.attack||f.special)?(f.kind==='nun'?.8:.4):1);
    if (Math.abs(move) > .1) { f.vx += move * f.speed * 8 * dt; if(!f.attack && !f.special)f.facing = move > 0 ? 1 : -1; }
    f.vx *= f.grounded ? .78 : .94; f.vx = Math.max(-f.speed*1.3, Math.min(f.speed*1.3, f.vx));
    f.vy += gravity * dt; f.x += f.vx * dt; f.y += f.vy * dt;
    platformCollision(f, prevY);
    f.walkDistance+=Math.abs(f.x-prevX);
    if(!wasGrounded && f.grounded)f.landing=.12;
    f.attack = Math.max(0, f.attack - dt); f.special = Math.max(0, f.special - dt); f.hurt = Math.max(0, f.hurt - dt); f.cooldown = Math.max(0, f.cooldown - dt);
    if (f.y > H + 90) { f.hp = 0; }
  }
  function playerControl() {
    let move = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) move -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) move += 1;
    return { move,guard:keys.has('KeyL') };
  }
  function aiControl(dt) {
    enemy.ai -= dt;
    const distance = player.x - enemy.x;
    if (enemy.ai <= 0) {
      enemy.ai = .18 + Math.random()*.2;
      if (Math.abs(distance) > enemy.reach * .7) enemy.intent = Math.sign(distance);
      else enemy.intent = 0;
      if (player.y + player.h < enemy.y - 20 && Math.random() < .55) jump(enemy);
      if (Math.abs(distance) < enemy.reach + 22 && Math.abs(player.y-enemy.y) < 70) startAttack(enemy, Math.random() < .28);
    }
    if(!enemy.attack&&!enemy.special)enemy.facing = distance >= 0 ? 1 : -1;
    return { move: enemy.intent || 0 };
  }
  function update(dt) {
    if (ended || !selected) return;
    updateFighter(player, dt, playerControl());
    updateFighter(enemy, dt, aiControl(dt));
    strike(player, enemy, false); strike(player, enemy, true); strike(enemy, player, false); strike(enemy, player, true);
    for(const f of [player,enemy]){
      if(f.kind==='wing'){
        if(!f.struck && f.attack>0 && .64-f.attack>=.32){wingCombat.fire(f);f.struck=true;}
        if(!f.struck && f.special>0 && .96-f.special>=.36){wingCombat.summon(f,f===player?enemy:player,platforms,W);f.struck=true;}
      }
      if(f.kind!=='nun')continue;
      if(f.special>0 && .8-f.special>=.4 && !f.struck){nunCombat.fire(f,true);f.struck=true;}
      if(f.attack>0){
        const schedule=f.fireMoving?[.14,.35]:[.28];
        while(f.shotsFired<schedule.length && .56-f.attack>=schedule[f.shotsFired]){
          nunCombat.fire(f,false,f.power/schedule.length);f.shotsFired++;
        }
      }
    }
    nunCombat.update(dt,[player,enemy],platforms,W,damageFighter);
    wingCombat.update(dt,[player,enemy],platforms,W,damageFighter);
    for (const e of effects) e.life -= dt;
    for (let i=effects.length-1;i>=0;i--) if (effects[i].life <= 0) effects.splice(i,1);
    if (enemy.hp <= 0) {
      effects.push({x:enemy.x+22,y:enemy.y+36,life:.55,big:true});
      if (round >= roundsToWin && !recovered) end(true); else nextRound();
    }
    if (player.hp <= 0) end(false);
  }
  function drawFighter(f) {
    if(f.kind==='wing' && window.SilencioWing.draw(ctx,f))return;
    if(f.kind==='nun' && window.SilencioNun.draw(ctx,f))return;
    if(f.kind==='scorpion' && window.SilencioScorpion.draw(ctx,f))return;
    if(f.kind==='frog' && window.SilencioFrog.draw(ctx,f))return;
    ctx.save(); ctx.translate(f.x+f.w/2,f.y+f.h/2); ctx.scale(f.facing,1);
    ctx.globalAlpha = f.hurt > 0 ? .72 : 1;
    ctx.strokeStyle = '#050505'; ctx.lineWidth = 6; ctx.fillStyle = f.color;
    if(f.kind==='scorpion') {
      ctx.beginPath();ctx.ellipse(0,15,30,18,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(-16,12);ctx.bezierCurveTo(-40,-50,35,-58,22,-8);ctx.stroke();
      ctx.fillRect(16,12,26,10);
    } else if (f.kind === 'frog') {
      ctx.beginPath();ctx.ellipse(0,0,23,33,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(-10,-22);ctx.lineTo(0,-48);ctx.lineTo(10,-22);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#ff1734';ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(45,25);ctx.stroke();
    } else if (f.kind === 'wing') {
      ctx.beginPath(); ctx.moveTo(-22,4); ctx.lineTo(-62,-18); ctx.lineTo(-34,18); ctx.lineTo(-72,28); ctx.lineTo(-20,30); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f5eee4'; ctx.fillRect(-16,-26,32,54); ctx.fillStyle = '#ff1734'; ctx.fillRect(8,-8,40,10); ctx.beginPath(); ctx.arc(0,-38,14,0,Math.PI*2); ctx.fill(); ctx.stroke();
    } else if (f.kind === 'nun') {
      ctx.fillStyle = '#111'; ctx.fillRect(-20,-34,40,66); ctx.strokeRect(-20,-34,40,66); ctx.fillStyle = '#f5eee4'; ctx.fillRect(-13,-28,26,24); ctx.fillStyle = '#ff1734'; ctx.fillRect(6,-3,48,10); ctx.fillRect(-4,16,8,22);
    } else {
      ctx.fillStyle = '#ff1734'; ctx.beginPath(); ctx.ellipse(0,-4,30,22,0,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#050505'; ctx.beginPath(); ctx.arc(0,-4,12,0,Math.PI*2); ctx.fill(); ctx.fillStyle = '#f5eee4'; ctx.fillRect(20,-2,40,8); ctx.fillRect(-16,20,12,24); ctx.fillRect(8,20,12,24);
    }
    if (f.attack > 0 || f.special > 0) { const big = f.special > 0; ctx.strokeStyle = big ? '#f5eee4' : '#ff1734'; ctx.lineWidth = big ? 6 : 4; ctx.beginPath(); ctx.arc(28,0,big?52:35,-.8,.8); ctx.stroke(); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function drawBars() {
    function bar(f,x,y,align){ ctx.fillStyle='#050505'; ctx.fillRect(x,y,310,18); ctx.strokeStyle='#f5eee4'; ctx.lineWidth=2; ctx.strokeRect(x,y,310,18); ctx.fillStyle=f.side===1?'#f5eee4':'#ff1734'; const w=310*Math.max(0,f.hp/f.maxHp); ctx.fillRect(align==='right'?x+310-w:x,y,w,18); ctx.fillStyle='#f5eee4'; ctx.font='700 14px monospace'; ctx.fillText(f.name,x,y-8); }
    bar(player,24,34,'left'); bar(enemy,W-334,34,'right');
    ctx.fillStyle='#ff1734'; ctx.font='900 20px monospace'; ctx.fillText(`ROUND ${Math.min(round,roundsToWin)} / ${roundsToWin}`,W/2-62,48);
  }
  function drawProjectiles(){
    for(const p of [...wingCombat.projectiles,...wingCombat.impacts]){
      if(!window.SilencioWing.drawMagic(ctx,p)){ctx.fillStyle='#ff1734';ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);ctx.fill();}
    }
    for(const f of wingCombat.flames){
      if(!window.SilencioWing.drawFire(ctx,f)){ctx.save();ctx.globalAlpha=Math.max(0,1-f.age/1.05);ctx.fillStyle='#ff1734';ctx.fillRect(f.x-24,f.y-140,48,140);ctx.restore();}
    }
    for(const p of nunCombat.projectiles){
      if(p.kind==='grenade'){
        if(!window.SilencioNun.drawGrenade(ctx,p.x,p.y,p.age)){ctx.fillStyle='#ff1734';ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);ctx.fill();}
      }else if(!window.SilencioNun.drawShot(ctx,p.x,p.y,Math.min(.2,p.age),p.facing)){
        ctx.fillStyle='#f5eee4';ctx.fillRect(p.x-6,p.y-2,12,4);
      }
    }
    for(const e of nunCombat.visuals){
      if(e.kind==='muzzle')window.SilencioNun.drawShot(ctx,e.x,e.y,e.age,e.facing);
      else if(!window.SilencioNun.drawExplosion(ctx,e.x,e.y,e.age)){
        ctx.save();ctx.globalAlpha=Math.max(0,1-e.age/.6);ctx.strokeStyle='#ff1734';ctx.lineWidth=6;ctx.beginPath();ctx.arc(e.x,e.y,30+e.age*110,0,Math.PI*2);ctx.stroke();ctx.restore();
      }
    }
  }
  function draw() {
    ctx.clearRect(0,0,W,H); ctx.fillStyle='#070707'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#21060b'; ctx.lineWidth=1; for(let x=-120;x<W;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+180,H);ctx.stroke();}
    ctx.fillStyle='#10080a'; ctx.fillRect(74,88,812,392); ctx.strokeStyle='#3b1018'; ctx.lineWidth=3; ctx.strokeRect(74,88,812,392);
    for(const p of platforms){ ctx.fillStyle=p.y===floor?'#f5eee4':'#1a0b0f'; ctx.fillRect(p.x,p.y,p.w,p.h); ctx.fillStyle='#ff1734'; ctx.fillRect(p.x,p.y,p.w,4); ctx.strokeStyle='#050505'; ctx.lineWidth=3; ctx.strokeRect(p.x,p.y,p.w,p.h); }
    if (player) {
      drawFighter(player); drawFighter(enemy);drawProjectiles();drawBars();
      canvas.dataset.playerState=player.kind==='wing'?window.SilencioWing.state(player):player.kind==='nun'?window.SilencioNun.state(player):window.SilencioFrog.state(player);canvas.dataset.facing=String(player.facing);
      canvas.dataset.magic=String(wingCombat.projectiles.length);canvas.dataset.flames=String(wingCombat.flames.length);
      canvas.dataset.projectiles=String(nunCombat.projectiles.length);canvas.dataset.grenades=String(nunCombat.projectiles.filter(p=>p.kind==='grenade').length);
      canvas.dataset.explosions=String(nunCombat.visuals.filter(p=>p.kind==='explosion').length);canvas.dataset.enemyHp=String(enemy.hp);
    }
    else { ctx.fillStyle='#ff1734'; ctx.font='900 26px monospace'; ctx.fillText('ESCOLHA SEU LUTADOR',330,260); }
    for(const e of effects){ ctx.globalAlpha=Math.max(0,e.life/.55); ctx.strokeStyle=e.big?'#f5eee4':'#ff1734'; ctx.lineWidth=e.big?8:4; ctx.beginPath(); ctx.arc(e.x,e.y,(1-e.life/.55)*(e.big?78:42),0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1; }
  }
  function tick(time){ const dt=Math.min(.05,(time-last)/1000||0); last=time; update(dt); draw(); loopId=requestAnimationFrame(tick); }
  select.addEventListener('click', event => { const button = event.target.closest('[data-fighter]'); if(button) begin(button.dataset.fighter); });
  document.addEventListener('keydown', event => { keys.add(event.code); if(['KeyA','KeyD','ArrowLeft','ArrowRight','Space','KeyJ','KeyK','KeyL'].includes(event.code)) event.preventDefault(); if(event.repeat)return; if(event.code==='Space') jump(player); if(event.code==='KeyJ') startAttack(player,false); if(event.code==='KeyK') startAttack(player,true); });
  document.addEventListener('keyup', event => keys.delete(event.code));
  for(const button of document.querySelectorAll('[data-hold]')){ const code=button.dataset.hold; const down=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);keys.add(code);}; const up=e=>{e.preventDefault();keys.delete(code);}; button.addEventListener('pointerdown',down); button.addEventListener('pointerup',up); button.addEventListener('pointercancel',up); button.addEventListener('lostpointercapture',up); }
  for(const button of document.querySelectorAll('[data-tap]')) button.addEventListener('click', () => { if(!player) return; if(button.dataset.tap==='Space') jump(player); if(button.dataset.tap==='KeyJ') startAttack(player,false); if(button.dataset.tap==='KeyK') startAttack(player,true); });
  canvas.addEventListener('pointerdown', event => { if(!player || player.attack || player.special) return; const rect=canvas.getBoundingClientRect(); const x=(event.clientX-rect.left)/rect.width*W; player.facing = x > player.x ? 1 : -1; startAttack(player,false); });
  window.PsicoZ?.onPause(paused => { if(paused) keys.clear(); else last=performance.now(); });
  window.addEventListener('blur',()=>keys.clear());
  report('playing','Escolha um personagem da capa.');
  loopId=requestAnimationFrame(tick);
})();

(() => {
  'use strict';
  const canvas = document.getElementById('brawler-canvas');
  const ctx = canvas.getContext('2d');
  const status = document.querySelector('[data-game-status]');
  const select = document.querySelector('[data-select]');
  const W = canvas.width, H = canvas.height, gravity = 1700, floor = 486, roundsToWin = 3;
  const keys = new Set();
  const effects = [];
  let player, enemy, round = 0, ended = false, selected = null, last = performance.now(), loopId;
  const fighters = {
    wing: { name:'Anjo Rasgado', hp:112, speed:250, jump:720, power:18, reach:58, color:'#f5eee4' },
    nun: { name:'Freira Armada', hp:145, speed:205, jump:620, power:25, reach:50, color:'#ff1734' },
    eye: { name:'Olho Febril', hp:96, speed:292, jump:680, power:15, reach:64, color:'#f5eee4' },
  };
  const roster = ['wing','nun','eye'];
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
    return { kind, side, x: side === 1 ? 210 : 750, y: floor - 72, vx:0, vy:0, w:44, h:72, hp:base.hp, maxHp:base.hp, facing: side, grounded:false, jumps:0, attack:0, special:0, hurt:0, cooldown:0, ai:0, score:0, ...base };
  }
  function begin(kind) {
    selected = kind; select.hidden = true; round = 0; nextRound();
  }
  function nextRound() {
    round += 1;
    const enemyKind = roster[(roster.indexOf(selected) + round) % roster.length];
    player = makeFighter(selected, 1); enemy = makeFighter(enemyKind, -1);
    enemy.hp += round * 10; enemy.maxHp = enemy.hp; enemy.power += round * 2;
    report('playing', `Derrube ${enemy.name}.`);
  }
  function end(won) { ended = true; report(won ? 'won' : 'lost', won ? 'Silêncio quebrado. Ringue recuperado.' : 'O silêncio engoliu o ringue.'); }
  function rects(a,b){ return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function attackBox(f, special=false) { const reach = special ? f.reach + 42 : f.reach; return {x:f.facing > 0 ? f.x + f.w - 6 : f.x - reach + 6, y:f.y + (special ? 10 : 18), w:reach, h:special ? 42 : 34}; }
  function strike(attacker, target, special=false) {
    if ((special && attacker.special <= 0) || (!special && attacker.attack <= 0)) return;
    const box = attackBox(attacker, special);
    if (!rects(box, target) || target.hurt > 0) return;
    const damage = special ? attacker.power + 18 : attacker.power;
    target.hp -= damage; target.hurt = .34; target.vx = attacker.facing * (special ? 620 : 420); target.vy = special ? -430 : -270;
    effects.push({x:target.x+target.w/2,y:target.y+target.h/2,life:.22,big:special});
  }
  function startAttack(f, special=false) {
    if (special) { if (f.cooldown <= 0) { f.special = .22; f.cooldown = 1.1; } }
    else if (f.attack <= 0) { f.attack = .18; f.cooldown = Math.max(f.cooldown,.18); }
  }
  function jump(f) { if (f.grounded || f.jumps < 2) { f.vy = -f.jump; f.grounded = false; f.jumps += 1; } }
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
    const prevY = f.y;
    const move = control.move;
    if (Math.abs(move) > .1) { f.vx += move * f.speed * 8 * dt; f.facing = move > 0 ? 1 : -1; }
    f.vx *= f.grounded ? .78 : .94; f.vx = Math.max(-f.speed*1.3, Math.min(f.speed*1.3, f.vx));
    f.vy += gravity * dt; f.x += f.vx * dt; f.y += f.vy * dt;
    platformCollision(f, prevY);
    f.attack = Math.max(0, f.attack - dt); f.special = Math.max(0, f.special - dt); f.hurt = Math.max(0, f.hurt - dt); f.cooldown = Math.max(0, f.cooldown - dt);
    if (f.y > H + 90) { f.hp = 0; }
  }
  function playerControl() {
    let move = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) move -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) move += 1;
    return { move };
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
    enemy.facing = distance >= 0 ? 1 : -1;
    return { move: enemy.intent || 0 };
  }
  function update(dt) {
    if (ended || !selected) return;
    updateFighter(player, dt, playerControl());
    updateFighter(enemy, dt, aiControl(dt));
    strike(player, enemy, false); strike(player, enemy, true); strike(enemy, player, false); strike(enemy, player, true);
    for (const e of effects) e.life -= dt;
    for (let i=effects.length-1;i>=0;i--) if (effects[i].life <= 0) effects.splice(i,1);
    if (enemy.hp <= 0) {
      effects.push({x:enemy.x+22,y:enemy.y+36,life:.55,big:true});
      if (round >= roundsToWin) end(true); else nextRound();
    }
    if (player.hp <= 0) end(false);
  }
  function drawFighter(f) {
    ctx.save(); ctx.translate(f.x+f.w/2,f.y+f.h/2); ctx.scale(f.facing,1);
    ctx.globalAlpha = f.hurt > 0 ? .72 : 1;
    ctx.strokeStyle = '#050505'; ctx.lineWidth = 6; ctx.fillStyle = f.color;
    if (f.kind === 'wing') {
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
  function draw() {
    ctx.clearRect(0,0,W,H); ctx.fillStyle='#070707'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#21060b'; ctx.lineWidth=1; for(let x=-120;x<W;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+180,H);ctx.stroke();}
    ctx.fillStyle='#10080a'; ctx.fillRect(74,88,812,392); ctx.strokeStyle='#3b1018'; ctx.lineWidth=3; ctx.strokeRect(74,88,812,392);
    for(const p of platforms){ ctx.fillStyle=p.y===floor?'#f5eee4':'#1a0b0f'; ctx.fillRect(p.x,p.y,p.w,p.h); ctx.fillStyle='#ff1734'; ctx.fillRect(p.x,p.y,p.w,4); ctx.strokeStyle='#050505'; ctx.lineWidth=3; ctx.strokeRect(p.x,p.y,p.w,p.h); }
    if (player) { drawFighter(player); drawFighter(enemy); drawBars(); }
    else { ctx.fillStyle='#ff1734'; ctx.font='900 26px monospace'; ctx.fillText('ESCOLHA SEU LUTADOR',330,260); }
    for(const e of effects){ ctx.globalAlpha=Math.max(0,e.life/.55); ctx.strokeStyle=e.big?'#f5eee4':'#ff1734'; ctx.lineWidth=e.big?8:4; ctx.beginPath(); ctx.arc(e.x,e.y,(1-e.life/.55)*(e.big?78:42),0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1; }
  }
  function tick(time){ const dt=Math.min(.05,(time-last)/1000||0); last=time; update(dt); draw(); if(!ended) loopId=requestAnimationFrame(tick); }
  select.addEventListener('click', event => { const button = event.target.closest('[data-fighter]'); if(button) begin(button.dataset.fighter); });
  document.addEventListener('keydown', event => { keys.add(event.code); if(['KeyA','KeyD','ArrowLeft','ArrowRight','Space','KeyJ','KeyK'].includes(event.code)) event.preventDefault(); if(event.code==='Space') jump(player); if(event.code==='KeyJ') startAttack(player,false); if(event.code==='KeyK') startAttack(player,true); });
  document.addEventListener('keyup', event => keys.delete(event.code));
  for(const button of document.querySelectorAll('[data-hold]')){ const code=button.dataset.hold; const down=e=>{e.preventDefault();keys.add(code);}; const up=e=>{e.preventDefault();keys.delete(code);}; button.addEventListener('pointerdown',down); button.addEventListener('pointerup',up); button.addEventListener('pointercancel',up); button.addEventListener('lostpointercapture',up); }
  for(const button of document.querySelectorAll('[data-tap]')) button.addEventListener('click', () => { if(!player) return; if(button.dataset.tap==='Space') jump(player); if(button.dataset.tap==='KeyJ') startAttack(player,false); if(button.dataset.tap==='KeyK') startAttack(player,true); });
  canvas.addEventListener('pointerdown', event => { if(!player) return; const rect=canvas.getBoundingClientRect(); const x=(event.clientX-rect.left)/rect.width*W; player.facing = x > player.x ? 1 : -1; startAttack(player,false); });
  window.PsicoZ?.onPause(paused => { if(paused) keys.clear(); else last=performance.now(); });
  report('playing','Escolha um personagem da capa.');
  loopId=requestAnimationFrame(tick);
})();

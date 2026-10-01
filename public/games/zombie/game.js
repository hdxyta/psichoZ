(() => {
  'use strict';
  const canvas = document.getElementById('zombie-canvas');
  const ctx = canvas.getContext('2d');
  const status = document.querySelector('[data-game-status]');
  const cards = document.querySelector('[data-cards]');
  const W = canvas.width, H = canvas.height, roundsToWin = 4;
  const keys = new Set(), bullets = [], zombies = [], particles = [];
  const player = {x:W/2, y:H/2, hp:100, maxHp:100, speed:160, damage:18, fireRate:.24, cooldown:0, pierce:0, dash:0, dashCooldown:0};
  let round = 0, queued = 0, spawnTimer = 0, intermission = true, ended = false, firing = false, aim = {x:W/2+1,y:H/2}, last = performance.now(), loopId;
  const upgrades = [
    {id:'rate', title:'Gatilho nervoso', text:'Dispara mais rapido.', apply(){ player.fireRate = Math.max(.1, player.fireRate * .72); }},
    {id:'damage', title:'Bala ritual', text:'Aumenta o dano dos tiros.', apply(){ player.damage += 10; }},
    {id:'speed', title:'Passo febril', text:'Move mais rapido.', apply(){ player.speed += 36; }},
    {id:'heal', title:'Curativo sujo', text:'Recupera vida e aumenta o limite.', apply(){ player.maxHp += 15; player.hp = Math.min(player.maxHp, player.hp + 45); }},
    {id:'dash', title:'Arranco vermelho', text:'Dash recarrega mais rapido.', apply(){ player.dashCooldown = Math.max(0, player.dashCooldown - .8); player.dash = 1; }},
    {id:'pierce', title:'Furo duplo', text:'Tiros atravessam mais um zumbi.', apply(){ player.pierce += 1; }},
  ];
  function report(phase, hint) {
    const label = `ROUND ${Math.min(round, roundsToWin)} / ${roundsToWin}`;
    status.textContent = `${label} · ${hint}`;
    window.PsicoZ?.report({phase, progress: Math.min(round, roundsToWin), total: roundsToWin, label:'ROUND', hint});
  }
  function chooseCards() {
    intermission = true;
    cards.hidden = false;
    cards.replaceChildren(...upgrades
      .map((card, index) => ({card, sort: (round * 17 + index * 11) % 23}))
      .sort((a,b)=>a.sort-b.sort).slice(0,3).map(({card}) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.innerHTML = `<strong>${card.title}</strong><span>${card.text}</span>`;
        button.addEventListener('click', () => {
          card.apply();
          cards.hidden = true;
          startRound();
        });
        return button;
      }));
    cards.querySelector('button')?.focus();
    report('playing', round ? 'Escolha uma carta para o proximo round.' : 'Escolha sua primeira carta.');
  }
  function startRound() {
    if (ended) return;
    intermission = false;
    round += 1;
    queued = 5 + round * 3;
    spawnTimer = .2;
    report('playing', `Round ${round}: segure a horda.`);
  }
  function spawnZombie() {
    const edge = Math.floor(Math.random() * 4);
    const z = {x:0,y:0,hp:34 + round * 14,max:34 + round * 14,speed:48 + round * 8,hit:0};
    if (edge === 0) { z.x = -30; z.y = Math.random()*H; }
    if (edge === 1) { z.x = W+30; z.y = Math.random()*H; }
    if (edge === 2) { z.x = Math.random()*W; z.y = -30; }
    if (edge === 3) { z.x = Math.random()*W; z.y = H+30; }
    zombies.push(z);
  }
  function end(won) {
    ended = true;
    cards.hidden = true;
    report(won ? 'won' : 'lost', won ? 'Quatro rounds limpos. Aditivo recuperado.' : 'A horda tomou o sinal.');
  }
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return {x:(event.clientX - rect.left) / rect.width * W, y:(event.clientY - rect.top) / rect.height * H};
  }
  function shoot() {
    const dx = aim.x - player.x, dy = aim.y - player.y, d = Math.hypot(dx, dy) || 1;
    bullets.push({x:player.x, y:player.y, vx:dx/d*520, vy:dy/d*520, life:.85, damage:player.damage, pierce:player.pierce});
    player.cooldown = player.fireRate;
  }
  canvas.addEventListener('pointerdown', event => { event.preventDefault(); canvas.setPointerCapture(event.pointerId); aim = point(event); firing = true; });
  canvas.addEventListener('pointermove', event => { aim = point(event); });
  for (const type of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(type, () => { firing = false; });
  document.addEventListener('keydown', event => {
    keys.add(event.code);
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','Space'].includes(event.code)) event.preventDefault();
    if ((event.code === 'ShiftLeft' || event.code === 'ShiftRight' || event.code === 'Space') && player.dashCooldown <= 0) {
      player.dash = .16; player.dashCooldown = 1.25;
    }
  });
  document.addEventListener('keyup', event => keys.delete(event.code));
  document.querySelector('[data-action="dash"]').addEventListener('click', () => { if (player.dashCooldown <= 0) { player.dash = .16; player.dashCooldown = 1.25; }});
  window.PsicoZ?.onPause(paused => { if (!paused) last = performance.now(); else keys.clear(); });
  function update(dt) {
    if (ended || intermission) return;
    let mx = 0, my = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) my -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) my += 1;
    const md = Math.hypot(mx,my) || 1, boost = player.dash > 0 ? 2.25 : 1;
    player.x = Math.max(24, Math.min(W-24, player.x + mx/md * player.speed * boost * dt));
    player.y = Math.max(24, Math.min(H-24, player.y + my/md * player.speed * boost * dt));
    player.cooldown -= dt; player.dash = Math.max(0, player.dash - dt); player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    if (firing && player.cooldown <= 0) shoot();
    if (queued) {
      spawnTimer -= dt;
      if (spawnTimer <= 0) { spawnZombie(); queued -= 1; spawnTimer = Math.max(.22, .7 - round * .07); }
    }
    for (const z of zombies) {
      z.hit = Math.max(0, z.hit - dt);
      const dx = player.x - z.x, dy = player.y - z.y, d = Math.hypot(dx,dy) || 1;
      z.x += dx/d * z.speed * dt; z.y += dy/d * z.speed * dt;
      if (d < 28) { player.hp -= 26 * dt; z.hit = .12; }
    }
    for (const b of bullets) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; }
    for (const b of bullets) for (const z of zombies) {
      if (b.life <= 0 || z.hp <= 0 || Math.hypot(b.x-z.x,b.y-z.y) > 20) continue;
      z.hp -= b.damage; z.hit = .1; b.pierce -= 1;
      particles.push({x:z.x,y:z.y,life:.25});
      if (b.pierce < 0) b.life = 0;
    }
    for (const p of particles) p.life -= dt;
    for (let i=zombies.length-1;i>=0;i--) if (zombies[i].hp <= 0) zombies.splice(i,1);
    for (let i=bullets.length-1;i>=0;i--) if (bullets[i].life <= 0 || bullets[i].x < -20 || bullets[i].x > W+20 || bullets[i].y < -20 || bullets[i].y > H+20) bullets.splice(i,1);
    for (let i=particles.length-1;i>=0;i--) if (particles[i].life <= 0) particles.splice(i,1);
    if (player.hp <= 0) end(false);
    if (round >= roundsToWin && !queued && zombies.length === 0) end(true);
    else if (round > 0 && !queued && zombies.length === 0) chooseCards();
  }
  function draw() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#070707'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = '#211115'; ctx.lineWidth = 1;
    for (let x=-80;x<W;x+=34) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+160,H); ctx.stroke(); }
    ctx.strokeStyle = '#33141a'; ctx.lineWidth = 3; ctx.strokeRect(72,62,816,416);
    ctx.fillStyle = '#10090b'; ctx.fillRect(92,82,776,376);
    for (const p of particles) { ctx.fillStyle = '#f51d36'; ctx.globalAlpha = p.life/.25; ctx.fillRect(p.x-13,p.y-13,26,26); ctx.globalAlpha = 1; }
    for (const b of bullets) { ctx.fillStyle = '#f2ece2'; ctx.fillRect(b.x-3,b.y-3,6,6); }
    for (const z of zombies) {
      ctx.fillStyle = z.hit ? '#f2ece2' : '#f51d36';
      ctx.beginPath(); ctx.arc(z.x,z.y,17,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#090909'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = '#090909'; ctx.fillRect(z.x-18,z.y-28,36,5);
      ctx.fillStyle = '#f2ece2'; ctx.fillRect(z.x-18,z.y-28,36*Math.max(0,z.hp/z.max),5);
    }
    const angle = Math.atan2(aim.y-player.y, aim.x-player.x);
    ctx.save(); ctx.translate(player.x,player.y); ctx.rotate(angle);
    ctx.fillStyle = '#f2ece2'; ctx.fillRect(-14,-14,28,28);
    ctx.fillStyle = '#f51d36'; ctx.fillRect(6,-5,26,10);
    ctx.restore();
    ctx.strokeStyle = '#f51d36'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(player.x,player.y,26,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#f2ece2'; ctx.font = '700 16px monospace';
    ctx.fillText(`VIDA ${Math.max(0,Math.ceil(player.hp))}/${player.maxHp}`, 24, 34);
    ctx.fillText(`ROUND ${Math.min(round,roundsToWin)}/${roundsToWin}`, 24, 58);
    ctx.fillText(`ZUMBIS ${zombies.length + queued}`, 24, 82);
    if (intermission && !ended) { ctx.fillStyle = '#f51d36'; ctx.font = '700 22px monospace'; ctx.fillText('ESCOLHA UMA CARTA', 362, 72); }
  }
  function tick(time) {
    const dt = Math.min(.05, (time-last)/1000 || 0); last = time;
    update(dt); draw();
    if (!ended) loopId = requestAnimationFrame(tick);
  }
  chooseCards();
  loopId = requestAnimationFrame(tick);
})();

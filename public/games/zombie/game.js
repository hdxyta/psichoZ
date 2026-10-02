(() => {
  'use strict';
  const canvas = document.getElementById('zombie-canvas');
  const ctx = canvas.getContext('2d');
  const status = document.querySelector('[data-game-status]');
  const cards = document.querySelector('[data-cards]');
  const weaponStatus = document.querySelector('[data-weapon-status]');
  const weaponNames = {knife:'Faca de exército',shotgun:'Shotgun',staff:'Cajado de magia'};
  const drops = [], effects = [];
  const damageFrame = new Image(); damageFrame.src = 'damage-frame.webp';
  let damagePulse = 0, damageFeedbackCooldown = 0;
  const reducedMotion = document.documentElement.dataset.reducedMotion === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cardsChosen = 0;
  function weaponHUD() {
    canvas.dataset.weapon = player.weapon || 'none';
    canvas.dataset.cardsChosen = String(cardsChosen);
    canvas.dataset.drop = drops.map(d=>d.kind).join(',');
    weaponStatus.textContent = `${player.weapon ? weaponNames[player.weapon] : 'Sem arma'} · ${cardsChosen} cartas` +
      (drops.length ? ` · Pegue ${weaponNames[drops[0].kind]} no círculo dourado.` : ' · F ou Atacar mira no inimigo mais próximo.');
  }
  const W = canvas.width, H = canvas.height, roundsToWin = 4;
  const map = window.AditivoMap, mapImage = new Image();
  mapImage.src='cemetery.webp';
  mapImage.onload=()=>{canvas.dataset.map='ready';};
  mapImage.onerror=()=>{canvas.dataset.map='fallback';};
  let world = window.AditivoCamera.layout(0,W,H);
  function expandWorld() {
    world=window.AditivoCamera.layout(cardsChosen,W,H);
    const right=Math.min(map.left+map.width,world.left+world.width),bottom=Math.min(map.top+map.height,world.top+world.height);
    world.left=Math.max(map.left,world.left);world.top=Math.max(map.top,world.top);
    world.width=right-world.left;world.height=bottom-world.top;
  }
  let navigation=null, navigationTimer=0;
  const camera = {x:W/2,y:H/2,zoom:1};
  let pointerAim = null;
  const keys = new Set(), bullets = [], zombies = [], particles = [];
  // The supplied sheet has a label gutter and 13 walk frames per direction.
  const spriteSheet = new Image();
  const walkFrames = [];
  const walkCenters = [
    [146,251,358,463,582,687,801,911,1020,1131,1244,1357,1469],
    [153,265,382,496,615,727,830,944,1046,1144,1260,1365,1472],
    [148,264,380,495,610,723,828,938,1050,1155,1270,1374,1480],
    [145,251,357,465,579,692,802,912,1025,1139,1250,1365,1476],
  ];
  spriteSheet.onload = () => {
    for (let row = 0; row < 4; row++) {
      walkFrames[row] = [];
      for (let col = 0; col < 13; col++) {
        const frame = document.createElement('canvas');
        frame.width = 112; frame.height = 128;
        const paint = frame.getContext('2d');
        const sx = (walkCenters[row][col] - 50) / 1536 * spriteSheet.naturalWidth;
        paint.drawImage(spriteSheet, sx, row / 8 * spriteSheet.naturalHeight,
          100 / 1536 * spriteSheet.naturalWidth, spriteSheet.naturalHeight / 8, 6, 0, 100, 128);
        // Feather the opaque sheet background into a soft red aura; never show labels or tile seams.
        paint.globalCompositeOperation = 'destination-in';
        const mask = paint.createRadialGradient(56, 64, 27, 56, 64, 64);
        mask.addColorStop(0, '#000'); mask.addColorStop(.68, '#000c'); mask.addColorStop(1, '#0000');
        paint.fillStyle = mask; paint.fillRect(0, 0, 112, 128);
        walkFrames[row].push(frame);
      }
    }
    canvas.dataset.sprites = 'ready';
  };
  spriteSheet.onerror = () => { canvas.dataset.sprites = 'fallback'; };
  spriteSheet.src = 'zombies-neon.png';
  const player = {x:W/2, y:H/2, hp:100, maxHp:100, speed:160, damage:18, fireRate:.24, cooldown:0, pierce:0, dash:0, dashCooldown:0, weapon:null, facing:'down', moving:false, anim:0, attack:0};
  let round = 0, queued = 0, spawnTimer = 0, intermission = true, ended = false, recovered = false, firing = false, aim = {x:W/2+1,y:H/2}, last = performance.now(), loopId;
  const upgrades = [
    {id:'rate', title:'Ritmo nervoso', text:'Acelera os ataques de qualquer arma.', apply(){ player.fireRate = Math.max(.1, player.fireRate * .72); }},
    {id:'damage', title:'Golpe ritual', text:'Aumenta o dano da arma equipada.', apply(){ player.damage += 10; }},
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
          if (!intermission || ended) return;
          card.apply();
          cardsChosen += 1;
          expandWorld();
          navigation=map.navigation(world,player);navigationTimer=.3;
          const kind = window.AditivoWeapons.dropForCards(cardsChosen);
          if (kind) {
            const spot=navigation.nearest({x:player.x+90,y:player.y});
            if(spot) drops.push({kind,...spot,fall:.75});
          }
          weaponHUD();
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
    spawnTimer = round === 1 ? 2.5 : 1;
    report('playing', `Round ${round}: segure a horda.`);
  }
  function spawnZombie() {
    const edge = Math.floor(Math.random() * 4);
    const z = {x:0,y:0,hp:34 + round * 14,max:34 + round * 14,speed:48 + round * 8,hit:0, facing:0, walk:Math.random()*13};
    if (edge === 0) { z.x = world.left-30; z.y = world.top+Math.random()*world.height; }
    if (edge === 1) { z.x = world.left+world.width+30; z.y = world.top+Math.random()*world.height; }
    if (edge === 2) { z.x = world.left+Math.random()*world.width; z.y = world.top-30; }
    if (edge === 3) { z.x = world.left+Math.random()*world.width; z.y = world.top+world.height+30; }
    const spot=navigation.nearest(z);
    if(spot) {
      // Spawn only on reachable ground; never materialize inside walls or other actors.
      const candidates=navigation.points.filter((p,i)=>navigation.costs[i]>=0 && Math.hypot(p.x-spot.x,p.y-spot.y)<100 && Math.hypot(p.x-player.x,p.y-player.y)>90 && zombies.every(other=>Math.hypot(p.x-other.x,p.y-other.y)>26));
      const spawn=candidates[Math.floor(Math.random()*candidates.length)];
      if(spawn){Object.assign(z,spawn);zombies.push(z);return true;}
    }
    return false;
  }
  function end(won) {
    if (won) {
      recovered = true;
      report('won', 'Quatro rounds limpos. Aditivo recuperado. Escolha outra recompensa e siga nas ondas.');
      chooseCards();
      return;
    }
    ended = true;
    cards.hidden = true;
    report('lost', 'A horda tomou o sinal.');
  }
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    pointerAim = {x:(event.clientX - rect.left-2) / (rect.width-4) * W, y:(event.clientY - rect.top-2) / (rect.height-4) * H};
    return window.AditivoCamera.toWorld(pointerAim.x,pointerAim.y,camera,W,H);
  }
  function shoot() {
    if (!player.weapon) return;
    const dx = aim.x - player.x, dy = aim.y - player.y, d = Math.hypot(dx, dy) || 1;
    const angle = Math.atan2(dy,dx), kind = player.weapon;
    player.facing = Math.abs(dx)>Math.abs(dy) ? (dx<0?'left':'right') : (dy<0?'up':'down');
    player.attack = .32;
    effects.push({kind,x:player.x+dx/d*30,y:player.y+dy/d*30,angle,life:.32});
    if (kind === 'knife') {
      for (const z of zombies) {
        const zx=z.x-player.x, zy=z.y-player.y, distance=Math.hypot(zx,zy);
        if (distance<=88 && map.sight(player,z) && (distance<28 || (zx*dx+zy*dy)/(distance*d)>.25)) {
          z.hp -= player.damage*2.8; z.hit=.15;
          map.move(z,zx/(distance||1)*16,zy/(distance||1)*16,12,world);
          particles.push({x:z.x,y:z.y,life:.25});
        }
      }
    } else {
      const spread = kind==='shotgun' ? [-.22,-.11,0,.11,.22] : [0];
      for (const offset of spread) bullets.push({x:player.x,y:player.y,vx:Math.cos(angle+offset)*(kind==='staff'?330:520),vy:Math.sin(angle+offset)*(kind==='staff'?330:520),life:kind==='staff'?1.6:.46,damage:player.damage*(kind==='staff'?3:1.2),pierce:player.pierce+(kind==='staff'?2:0),kind,angle:angle+offset,hit:new Set()});
    }
    player.cooldown = (kind==='knife'?.42:kind==='shotgun'?.8:.58)*player.fireRate/.24;
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
  window.PsicoZ?.onPause(paused => { if (!paused) last = performance.now(); else { keys.clear(); firing=false; } });
  window.addEventListener('blur',()=>{keys.clear();firing=false;});
  function update(dt) {
    const blend=reducedMotion?1:1-Math.exp(-dt*7);
    camera.zoom+=(world.zoom-camera.zoom)*blend;
    camera.x+=(window.AditivoCamera.center(player.x,world.left,world.width,W/camera.zoom)-camera.x)*blend;
    camera.y+=(window.AditivoCamera.center(player.y,world.top,world.height,H/camera.zoom)-camera.y)*blend;
    if (pointerAim) aim=window.AditivoCamera.toWorld(pointerAim.x,pointerAim.y,camera,W,H);
    damagePulse = Math.max(0,damagePulse-dt);
    damageFeedbackCooldown = Math.max(0,damageFeedbackCooldown-dt);
    if (ended || intermission) return;
    let mx = 0, my = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) my -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) my += 1;
    player.moving = Boolean(mx || my);
    player.anim += dt;
    player.attack = Math.max(0,player.attack-dt);
    if (player.moving && player.attack<=0) player.facing = Math.abs(mx)>Math.abs(my) ? (mx<0?'left':'right') : (my<0?'up':'down');
    const md = Math.hypot(mx,my) || 1, boost = player.dash > 0 ? 2.25 : 1;
    map.move(player,mx/md*player.speed*boost*dt,my/md*player.speed*boost*dt,12,world);
    navigationTimer-=dt;
    if(navigationTimer<=0){navigation=map.navigation(world,player);navigationTimer=.3;}
    player.cooldown -= dt; player.dash = Math.max(0, player.dash - dt); player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    for (let i=drops.length-1;i>=0;i--) {
      const drop=drops[i];drop.fall=Math.max(0,drop.fall-dt);
      if (!drop.fall && Math.hypot(player.x-drop.x,player.y-drop.y)<30) {
        player.weapon=window.AditivoWeapons.collect(player.weapon,drop.kind);
        drops.splice(i,1);player.cooldown=0;weaponHUD();
      }
    }
    if (keys.has('KeyF') && !firing) {
      const nearest = zombies.reduce((best,z)=>!best || Math.hypot(z.x-player.x,z.y-player.y)<Math.hypot(best.x-player.x,best.y-player.y)?z:best,null);
      if (nearest) aim={x:nearest.x,y:nearest.y};
    }
    if ((firing || keys.has('KeyF')) && player.cooldown <= 0) shoot();
    for (let i=effects.length-1;i>=0;i--) { effects[i].life-=dt; if (effects[i].life<=0) effects.splice(i,1); }
    if (queued) {
      spawnTimer -= dt;
      if (spawnTimer <= 0) { if(spawnZombie()) queued -= 1; spawnTimer = Math.max(.22, .7 - round * .07); }
    }
    for (const z of zombies) {
      z.hit = Math.max(0, z.hit - dt);
      const target=navigation.direction(z);
      const dx = target.x - z.x, dy = target.y - z.y, d = Math.hypot(dx,dy) || 1;
      // Hysteresis prevents flickering between rows near a diagonal.
      if (Math.abs(dx) > Math.abs(dy) * 1.15) z.facing = dx < 0 ? 1 : 2;
      else if (Math.abs(dy) > Math.abs(dx) * 1.15) z.facing = dy < 0 ? 3 : 0;
      z.walk = (z.walk + dt * z.speed / 7) % 13;
      const step=Math.min(d,z.speed*dt);
      map.move(z,dx/d*step,dy/d*step,12,world);
      if (Math.hypot(player.x-z.x,player.y-z.y) < 27 && map.sight(z,player)) {
        player.hp -= 26 * dt; z.hit = .12;
        // Contact damage is continuous; let each visual pulse finish before retriggering.
        if (damageFeedbackCooldown <= 0) { damagePulse=.3; damageFeedbackCooldown=.45; }
      }
    }
    map.separate([player,...zombies.filter(z=>z.hp>0)],world);
    for (const b of bullets) {
      const next={x:b.x+b.vx*dt,y:b.y+b.vy*dt};
      if(!map.sight(b,next,2,world)) b.life=0;
      else {b.x=next.x;b.y=next.y;b.life-=dt;}
    }
    for (const b of bullets) for (const z of zombies) {
      if (b.life <= 0 || z.hp <= 0 || b.hit.has(z) || Math.hypot(b.x-z.x,b.y-z.y) > 20) continue;
      b.hit.add(z);
      z.hp -= b.damage; z.hit = .1; b.pierce -= 1;
      particles.push({x:z.x,y:z.y,life:.25});
      if (b.pierce < 0) b.life = 0;
    }
    for (const p of particles) p.life -= dt;
    for (let i=zombies.length-1;i>=0;i--) if (zombies[i].hp <= 0) zombies.splice(i,1);
    for (let i=bullets.length-1;i>=0;i--) if (bullets[i].life <= 0 || bullets[i].x < world.left-20 || bullets[i].x > world.left+world.width+20 || bullets[i].y < world.top-20 || bullets[i].y > world.top+world.height+20) bullets.splice(i,1);
    for (let i=particles.length-1;i>=0;i--) if (particles[i].life <= 0) particles.splice(i,1);
    if (player.hp <= 0) end(false);
    if (round >= roundsToWin && !queued && zombies.length === 0 && !recovered) end(true);
    else if (round > 0 && !queued && zombies.length === 0) chooseCards();
  }
  function draw() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#070707'; ctx.fillRect(0,0,W,H);
    ctx.save();ctx.translate(W/2,H/2);ctx.scale(camera.zoom,camera.zoom);ctx.translate(-camera.x,-camera.y);
    if(mapImage.complete && mapImage.naturalWidth) ctx.drawImage(mapImage,map.left,map.top,map.width,map.height);
    else {
      ctx.fillStyle='#10090b';ctx.fillRect(map.left,map.top,map.width,map.height);
      ctx.strokeStyle='#c42635';ctx.lineWidth=10;
      for(const wall of map.walls){ctx.beginPath();ctx.moveTo(wall[0],wall[1]);ctx.lineTo(wall[2],wall[3]);ctx.stroke();}
    }
    // Unexplored territory is visible but darkened until later card milestones.
    ctx.fillStyle='#000b';
    ctx.fillRect(map.left,map.top,map.width,world.top-map.top);
    ctx.fillRect(map.left,world.top+world.height,map.width,map.top+map.height-world.top-world.height);
    ctx.fillRect(map.left,world.top,world.left-map.left,world.height);
    ctx.fillRect(world.left+world.width,world.top,map.left+map.width-world.left-world.width,world.height);
    for (const p of particles) { ctx.fillStyle = '#f51d36'; ctx.globalAlpha = p.life/.25; ctx.fillRect(p.x-13,p.y-13,26,26); ctx.globalAlpha = 1; }
    for (const drop of drops) {
      ctx.strokeStyle='#ffd477';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(drop.x,drop.y+12,25,12,0,0,Math.PI*2);ctx.stroke();
      ctx.save();ctx.translate(drop.x,drop.y-drop.fall*80);ctx.strokeStyle='#ffd477';ctx.fillStyle='#fff';ctx.lineWidth=5;
      ctx.beginPath();ctx.moveTo(-12,12);ctx.lineTo(12,-12);ctx.stroke();
      if(drop.kind==='staff'){ctx.fillStyle='#ff284d';ctx.beginPath();ctx.arc(12,-12,7,0,Math.PI*2);ctx.fill();}
      else if(drop.kind==='knife'){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(10,-19);ctx.lineTo(13,-7);ctx.fill();}
      else {ctx.fillStyle='#ad6647';ctx.fillRect(-18,5,15,8);}
      ctx.restore();ctx.font='bold 13px monospace';ctx.fillStyle='#ffd477';ctx.textAlign='center';ctx.fillText(weaponNames[drop.kind],drop.x,drop.y+38);ctx.textAlign='left';
    }
    for (const b of bullets) {
      if (b.kind==='staff') window.AditivoArt.effect(ctx,'staff',b.x,b.y,b.angle,((1.6-b.life)*2)%1);
      else {ctx.fillStyle='#f2ece2';ctx.fillRect(b.x-3,b.y-3,6,6);}
    }
    for (const z of [...zombies].sort((a,b) => a.y-b.y)) {
      const sprite = walkFrames[z.facing]?.[Math.floor(z.walk)];
      if (sprite) {
        ctx.drawImage(sprite, z.x-28, z.y-40, 56, 64);
        if (z.hit) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(z.x,z.y+12,16,6,0,0,Math.PI*2); ctx.stroke(); }
      } else {
      ctx.fillStyle = z.hit ? '#f2ece2' : '#f51d36';
      ctx.beginPath(); ctx.arc(z.x,z.y,17,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#090909'; ctx.lineWidth = 4; ctx.stroke();
      }
      ctx.fillStyle = '#090909'; ctx.fillRect(z.x-18,z.y-42,36,5);
      ctx.fillStyle = '#f2ece2'; ctx.fillRect(z.x-18,z.y-42,36*Math.max(0,z.hp/z.max),5);
    }
    ctx.save();
    if (damagePulse>0 && !reducedMotion) {
      const elapsed=.3-damagePulse, strength=3*damagePulse/.3;
      ctx.translate(Math.sin(elapsed*110)*strength,Math.cos(elapsed*85)*strength*.6);
    }
    if (!window.AditivoArt.drawPlayer(ctx,player)) {
      ctx.fillStyle='#f2ece2';ctx.fillRect(player.x-12,player.y-18,24,32);
      if(player.weapon){ctx.fillStyle='#f51d36';ctx.fillRect(player.x+8,player.y-3,20,6);}
    }
    ctx.restore();
    for (const fx of effects) window.AditivoArt.effect(ctx,fx.kind,fx.x,fx.y,fx.angle,1-fx.life/.32);
    ctx.strokeStyle = '#f51d36'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(player.x,player.y+18,19,7,0,0,Math.PI*2); ctx.stroke();
    ctx.restore(); // HUD and damage vignette stay fixed to the screen.
    if (damagePulse>0) {
      const elapsed=.3-damagePulse;
      const fade=Math.min(1,elapsed/.05)*Math.min(1,damagePulse/.25);
      ctx.save();ctx.globalAlpha=fade*(reducedMotion?.35:.7);
      if(damageFrame.complete && damageFrame.naturalWidth) ctx.drawImage(damageFrame,0,0,W,H);
      else {
        const gradient=ctx.createRadialGradient(W/2,H/2,H*.22,W/2,H/2,W*.58);
        gradient.addColorStop(0,'#ff000000');gradient.addColorStop(1,'#de001b');
        ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
      }
      ctx.restore();
    }
    ctx.fillStyle = '#f2ece2'; ctx.font = '700 16px monospace';
    ctx.fillText(`VIDA ${Math.max(0,Math.ceil(player.hp))}/${player.maxHp}`, 24, 34);
    ctx.fillText(`ROUND ${round} · CARTAS ${cardsChosen}`, 24, 58);
    ctx.fillText(`ZUMBIS ${zombies.length + queued}`, 24, 82);
    if (intermission && !ended) { ctx.fillStyle = '#f51d36'; ctx.font = '700 22px monospace'; ctx.fillText('ESCOLHA UMA CARTA', 362, 72); }
  }
  function tick(time) {
    const dt = Math.min(.05, (time-last)/1000 || 0); last = time;
    update(dt); draw();
    loopId = requestAnimationFrame(tick);
  }
  chooseCards();
  weaponHUD();
  loopId = requestAnimationFrame(tick);
})();

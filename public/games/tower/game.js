(() => {
  'use strict';
  const canvas = document.getElementById('tower-canvas');
  const ctx = canvas.getContext('2d');
  const status = document.querySelector('[data-game-status]');
  const buttons = [...document.querySelectorAll('[data-build]')];
  const waveButton = document.querySelector('[data-action="wave"]');
  const mapArt = document.querySelector('.map-art');
  const W = canvas.width, H = canvas.height;
  // Coordinates traced on the supplied 1536 × 1024 artwork, including its bends.
  const point = ([x, y]) => ({x:x / 1536 * W, y:y / 1024 * H});
  const path = [
    [-40,495],[336,495],[354,478],[354,294],[370,276],[663,276],
    [680,294],[680,633],[698,652],[920,652],[939,634],[939,431],
    [956,414],[1160,414],[1178,431],[1178,616],[1196,634],[1485,634],
  ].map(point);
  const sitePlan = [
    {at:[245,387]},{at:[490,360]},{at:[553,538]},{at:[797,540]},
    {at:[829,345]},{at:[1056,522]},{at:[1292,511]},{at:[1334,740]},
    {at:[410,705], unlockCost:45},{at:[715,212], unlockCost:55},
    {at:[1018,336], unlockCost:60},{at:[1210,738], unlockCost:70},
  ];
  const sites = sitePlan.map(site => ({...point(site.at), unlockCost:site.unlockCost || 0, locked:Boolean(site.unlockCost)}));
  const background = new Image();
  let mapReady = false;
  let animatedMapReady = false;
  mapArt.addEventListener('load', () => {
    animatedMapReady = true;
    mapReady = true;
    canvas.dataset.map = 'ready';
  });
  mapArt.addEventListener('error', () => {
    mapArt.hidden = true;
    if (!mapReady) canvas.dataset.map = 'fallback';
  });
  background.onload = () => {
    mapReady = true;
    if (!animatedMapReady) canvas.dataset.map = 'ready';
  };
  background.onerror = () => {
    if (animatedMapReady) return;
    canvas.dataset.map = 'fallback';
    document.querySelector('.map-notice').hidden = false;
  };
  background.src = 'inferno-map.webp';
  const wavesToWin = 5;
  const kinds = {
    needle: {label:'Torre agulha', cost:20, range:170, rate:.34, damage:22, slow:0, color:'#f51d36', file:'tower-needle.webp', size:48, shot:'red'},
    chain: {label:'Corrente lenta', cost:35, range:150, rate:.58, damage:10, slow:.45, color:'#f2ece2', file:'tower-chain.webp', size:52, shot:'white'},
    orb: {label:'Olho infernal', cost:55, range:205, rate:.46, damage:32, slow:.18, color:'#ff7a18', file:'tower-orb.webp', size:58, shot:'red', unlockAfterWin:true},
    portal: {label:'Portal runico', cost:70, range:185, rate:.82, damage:18, splash:70, slow:.7, color:'#f2ece2', file:'tower-portal.webp', size:60, shot:'white', unlockAfterWin:true},
  };
  const towerImages = {};
  Object.entries(kinds).forEach(([name, kind]) => {
    const image = new Image();
    image.src = kind.file;
    towerImages[name] = image;
  });
  const shotSheets = {
    red: {image:new Image(), file:'shot-red.webp', cols:4, rows:3, frames:12, size:40},
    white: {image:new Image(), file:'shot-white.webp', cols:4, rows:3, frames:12, size:38},
  };
  Object.values(shotSheets).forEach(sheet => { sheet.image.src = sheet.file; });
  const minionImages = {};
  const minionTypes = {
    basic: {label:'minion basico', file:'minion-basic.webp', hp:34, speed:76, size:30, reward:10, damage:1},
    bat: {label:'morcego', file:'minion-bat.webp', hp:22, speed:95, size:22, reward:12, damage:1},
    mage: {label:'mago', file:'minion-mage.webp', hp:52, speed:68, size:34, reward:16, damage:1, shotRate:5.8, shotRange:210},
    lion: {label:'leao', file:'minion-lion.webp', hp:96, speed:48, size:45, reward:24, damage:1},
    boss: {label:'boss', file:'minion-boss.webp', hp:210, speed:34, size:62, reward:55, damage:2},
  };
  const wavePlans = [
    ['basic','basic','basic'],
    ['basic','basic','basic','bat','bat'],
    ['basic','basic','bat','bat','mage'],
    ['basic','bat','bat','mage','mage','lion'],
    ['bat','bat','mage','mage','lion','lion','boss'],
  ];
  Object.entries(minionTypes).forEach(([name, type]) => {
    const image = new Image();
    image.onload = () => { image.dataset.ready = 'true'; };
    image.src = type.file;
    minionImages[name] = image;
  });
  sites.forEach((site, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.site = String(index + 1);
    button.style.left = `${site.x / W * 100}%`;
    button.style.top = `${site.y / H * 100}%`;
    button.toggleAttribute('data-locked', site.locked);
    button.setAttribute('aria-label', site.locked ? `Sigilo ${index + 1}: abrir por ${site.unlockCost} sinal` : `Sigilo ${index + 1}: construir torre`);
    button.addEventListener('click', () => buildAt(site.x, site.y));
    document.querySelector('.tower-sites').append(button);
    site.button = button;
  });
  let money, base, wave, queued, waveTimer, nextWaveDelay, selected, enemies, towers, shots, enemyShots, last, ended, recovered, loopId;
  function reset() {
    money = 100; base = 10; wave = 0; queued = []; waveTimer = 0; nextWaveDelay = 0; selected = 'needle';
    enemies = []; towers = []; shots = []; enemyShots = []; last = performance.now(); ended = false; recovered = false;
    sites.forEach(site => {
      site.tower = null;
      site.locked = Boolean(site.unlockCost);
      site.button.toggleAttribute('data-locked', site.locked);
      site.button.removeAttribute('aria-disabled');
      site.button.setAttribute('aria-label', site.locked ? `Sigilo ${sites.indexOf(site) + 1}: abrir por ${site.unlockCost} sinal` : `Sigilo ${sites.indexOf(site) + 1}: construir torre`);
    });
    syncTowerButtons();
    report('playing', 'Toque em um sigilo para erguer uma torre.');
    cancelAnimationFrame(loopId);
    loopId = requestAnimationFrame(tick);
  }
  function report(phase, hint) {
    const text = phase === 'won' ? 'Torre preservada.' : phase === 'lost' ? 'A torre caiu.' : hint;
    status.textContent = `ONDAS ${Math.min(wave, wavesToWin)} / ${wavesToWin} · ${text}`;
    syncTowerButtons();
    window.PsicoZ?.report({phase, progress: Math.min(wave, wavesToWin), total: wavesToWin, label: 'ONDAS', hint: text});
  }
  function spawnWave() {
    if (ended || queued.length) return;
    wave += 1;
    queued = [...wavePlans[Math.min(wave - 1, wavePlans.length - 1)]];
    waveTimer = 0; nextWaveDelay = 0;
    report('playing', `Onda ${wave}. ${waveHint(wave)}`);
  }
  function spawnEnemy() {
    const name = queued.shift();
    const type = minionTypes[name];
    const hp = Math.round(type.hp * (1 + (wave - 1) * .14));
    enemies.push({type:name, x:path[0].x, y:path[0].y, node:1, hp, max:hp, speed:type.speed, slow:0, cast:type.shotRate ? type.shotRate * .65 : 0});
  }
  function waveHint(number) {
    return [
      'Somente minions basicos.',
      'Minions basicos e morcegos rapidos.',
      'Os magos entram atirando devagar.',
      'Leoes lentos seguram a linha.',
      'Boss lento e gigante no portal.',
    ][Math.min(number - 1, wavePlans.length - 1)];
  }
  function buildAt(x, y) {
    if (ended) return;
    const site = sites.find(point => Math.hypot(point.x - x, point.y - y) < 36);
    if (!site || site.tower) return;
    if (site.locked) {
      if (money < site.unlockCost) { report('playing', `Faltam sinais para abrir este sigilo: ${site.unlockCost}.`); return; }
      money -= site.unlockCost;
      site.locked = false;
      site.button.removeAttribute('data-locked');
      site.button.setAttribute('aria-label', `Sigilo ${sites.indexOf(site) + 1}: construir torre`);
      report('playing', `Sigilo aberto. Sinal restante: ${money}.`);
      return;
    }
    const kind = kinds[selected];
    if (isTowerLocked(kind)) { report('playing', 'Essa torre desperta depois da onda 5.'); return; }
    if (money < kind.cost) { report('playing', 'Sinal insuficiente para essa torre.'); return; }
    money -= kind.cost;
    site.tower = {kind:selected, cooldown:0};
    towers.push({site, ...kind, cooldown:0});
    site.button.setAttribute('aria-label', `Sigilo ${sites.indexOf(site) + 1}: ${kind.label || selected} construída`);
    site.button.setAttribute('aria-disabled', 'true');
    report('playing', `Torre erguida. Sinal restante: ${money}.`);
  }
  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return {x:(event.clientX - rect.left) / rect.width * W, y:(event.clientY - rect.top) / rect.height * H};
  }
  canvas.addEventListener('pointerdown', event => {
    event.preventDefault();
    const point = pointFromEvent(event);
    buildAt(point.x, point.y);
  });
  buttons.forEach(button => button.addEventListener('click', () => {
    const kind = kinds[button.dataset.build];
    if (isTowerLocked(kind)) { report('playing', 'Essa torre libera depois da onda 5.'); return; }
    selected = button.dataset.build;
    syncTowerButtons();
    report('playing', `${kind.label || button.textContent.trim()} selecionada.`);
  }));
  waveButton.addEventListener('click', spawnWave);
  document.addEventListener('keydown', event => {
    if (event.code === 'Digit1') buttons[0].click();
    if (event.code === 'Digit2') buttons[1].click();
    if (event.code === 'Digit3') buttons[2].click();
    if (event.code === 'Digit4') buttons[3].click();
    // Let focused native buttons handle Enter/Space once, including the sigils.
    if ((event.code === 'Space' || event.code === 'Enter') && !event.target.closest?.('button')) { event.preventDefault(); spawnWave(); }
  });
  window.PsicoZ?.onPause(paused => { if (!paused) last = performance.now(); });
  function tick(time) {
    const dt = Math.min(.05, (time - last) / 1000 || 0); last = time;
    update(dt); draw();
    loopId = requestAnimationFrame(tick);
  }
  function update(dt) {
    if (ended) return;
    if (queued.length) {
      waveTimer -= dt;
      if (waveTimer <= 0) { spawnEnemy(); waveTimer = Math.max(.32, .82 - wave * .05); }
    }
    if (wave > 0 && !queued.length && enemies.length === 0) {
      nextWaveDelay += dt;
      if (nextWaveDelay > 2.2) spawnWave();
    }
    for (const enemy of enemies) {
      if (enemy.slow > 0) enemy.slow -= dt;
      const type = minionTypes[enemy.type];
      if (type.shotRate) {
        enemy.cast -= dt;
        if (enemy.cast <= 0) {
          const targetTower = towers.find(tower => Math.hypot(enemy.x - tower.site.x, enemy.y - tower.site.y) <= type.shotRange);
          if (targetTower) {
            enemyShots.push({x1:enemy.x, y1:enemy.y, x2:targetTower.site.x, y2:targetTower.site.y, life:.22});
            targetTower.cooldown += .18;
          }
          enemy.cast = type.shotRate;
        }
      }
      const target = path[enemy.node];
      const speed = enemy.speed * (enemy.slow > 0 ? .56 : 1);
      const dx = target.x - enemy.x, dy = target.y - enemy.y, dist = Math.hypot(dx, dy);
      if (dist < speed * dt) {
        enemy.x = target.x; enemy.y = target.y; enemy.node += 1;
        if (enemy.node >= path.length) { enemy.dead = true; base -= minionTypes[enemy.type].damage; }
      } else {
        enemy.x += dx / dist * speed * dt; enemy.y += dy / dist * speed * dt;
      }
    }
    enemies = enemies.filter(enemy => !enemy.dead && enemy.hp > 0);
    for (const tower of towers) {
      tower.cooldown -= dt;
      if (tower.cooldown > 0) continue;
      const target = enemies.find(enemy => Math.hypot(enemy.x - tower.site.x, enemy.y - tower.site.y) <= tower.range);
      if (!target) continue;
      target.hp -= tower.damage; if (tower.slow) target.slow = .9;
      if (tower.splash) {
        for (const enemy of enemies) {
          if (enemy !== target && Math.hypot(enemy.x - target.x, enemy.y - target.y) <= tower.splash) {
            enemy.hp -= Math.round(tower.damage * .55);
            enemy.slow = Math.max(enemy.slow, .7);
          }
        }
      }
      if (target.hp <= 0) money += minionTypes[target.type].reward + wave;
      shots.push({x1:tower.site.x, y1:tower.site.y - 18, x2:target.x, y2:target.y, age:0, life:.24, color:tower.color, sheet:tower.shot});
      tower.cooldown = tower.rate;
    }
    shots.forEach(shot => { shot.age += dt; shot.life -= dt; });
    enemyShots.forEach(shot => shot.life -= dt);
    shots = shots.filter(shot => shot.life > 0);
    enemyShots = enemyShots.filter(shot => shot.life > 0);
    if (base <= 0) end(false);
    if (wave >= wavesToWin && !queued.length && enemies.length === 0 && !recovered) end(true);
  }
  function end(won) {
    if (won) {
      recovered = true;
      report('won', 'As três ondas foram contidas. Continue chamando ondas se quiser.');
      return;
    }
    ended = true;
    report('lost', 'A torre perdeu todo o sinal.');
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (animatedMapReady) {
      ctx.clearRect(0, 0, W, H);
    } else if (mapReady) {
      ctx.fillStyle = '#080808'; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(background, 0, 0, W, H);
    }
    else {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = '#9c1b29'; ctx.lineWidth = 54; tracePath();
      ctx.strokeStyle = '#241015'; ctx.lineWidth = 48; tracePath();
      const portal = path[path.length - 1];
      ctx.strokeStyle = '#f2ece2'; ctx.lineWidth = 3; ctx.strokeRect(portal.x - 22, portal.y - 30, 44, 60);
    }
    for (const [index, site] of sites.entries()) {
      ctx.save(); ctx.translate(site.x, site.y);
      ctx.fillStyle = '#0a0306ed';
      ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = site.tower ? kinds[site.tower.kind].color : site.locked ? '#ff7a18' : '#efc4bd'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0,-27); ctx.lineTo(27,0); ctx.lineTo(0,27); ctx.lineTo(-27,0); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.stroke();
      if (site.tower) {
        const kind = kinds[site.tower.kind];
        const image = towerImages[site.tower.kind];
        const size = kind.size;
        ctx.shadowColor = kind.color;
        ctx.shadowBlur = 12;
        if (image?.complete && image.naturalWidth > 0) {
          ctx.drawImage(image, -size / 2, -size * .82, size, size);
        } else {
          ctx.fillStyle = kind.color;
          ctx.fillRect(-4, -23, 8, 42);
          if (site.tower.kind === 'chain') { ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.stroke(); }
        }
      } else if (site.locked) {
        ctx.fillStyle = '#ff7a18'; ctx.font = '700 11px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(site.unlockCost), 0, -2);
        ctx.fillStyle = '#f2ece2'; ctx.fillRect(-7, 6, 14, 10); ctx.strokeRect(-7, 6, 14, 10);
        ctx.beginPath(); ctx.arc(0, 6, 6, Math.PI, 0); ctx.stroke();
      } else {
        ctx.fillStyle = '#f2ece2'; ctx.font = '700 18px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(index + 1), 0, 1);
      }
      ctx.restore();
    }
    for (const shot of enemyShots) {
      ctx.strokeStyle = '#ff7a18'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(shot.x1, shot.y1); ctx.lineTo(shot.x2, shot.y2); ctx.stroke();
    }
    for (const shot of shots) drawTowerShot(shot);
    for (const enemy of enemies) {
      const type = minionTypes[enemy.type];
      const image = minionImages[enemy.type];
      const size = type.size;
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.shadowColor = enemy.slow > 0 ? '#f2ece2' : '#ef233c';
      ctx.shadowBlur = enemy.slow > 0 ? 12 : 7;
      if (image?.complete && image.naturalWidth > 0) {
        ctx.drawImage(image, -size, -size, size * 2, size * 2);
      } else {
        ctx.fillStyle = enemy.slow > 0 ? '#f2ece2' : '#f51d36';
        ctx.beginPath(); ctx.arc(0, 0, size * .45, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      const barWidth = Math.max(28, size * 1.25);
      ctx.fillStyle = '#090909'; ctx.fillRect(enemy.x - barWidth / 2, enemy.y - size - 9, barWidth, 5);
      ctx.fillStyle = enemy.type === 'boss' ? '#ff7a18' : '#f2ece2';
      ctx.fillRect(enemy.x - barWidth / 2, enemy.y - size - 9, barWidth * Math.max(0, enemy.hp / enemy.max), 5);
    }
    document.querySelector('[data-money]').textContent = `SINAL ${money}`;
    document.querySelector('[data-base]').textContent = `TORRE ${base}`;
  }
  function tracePath() {
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (const point of path.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }
  function drawTowerShot(shot) {
    const sheet = shotSheets[shot.sheet];
    const progress = Math.min(1, shot.age / (shot.age + shot.life || 1));
    const x = shot.x1 + (shot.x2 - shot.x1) * progress;
    const y = shot.y1 + (shot.y2 - shot.y1) * progress;
    const angle = Math.atan2(shot.y2 - shot.y1, shot.x2 - shot.x1) + Math.PI / 2;
    const frame = Math.min(sheet.frames - 1, Math.floor(progress * sheet.frames));
    const col = frame % sheet.cols;
    const row = Math.floor(frame / sheet.cols);
    const image = sheet.image;
    if (image?.complete && image.naturalWidth > 0) {
      const fw = image.naturalWidth / sheet.cols;
      const fh = image.naturalHeight / sheet.rows;
      const size = sheet.size * (.82 + progress * .44);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.globalAlpha = .9 - progress * .18;
      ctx.shadowColor = shot.color;
      ctx.shadowBlur = 14;
      ctx.drawImage(image, col * fw, row * fh, fw, fh, -size / 2, -size / 2, size, size);
      ctx.restore();
      return;
    }
    ctx.strokeStyle = shot.color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(shot.x1, shot.y1); ctx.lineTo(shot.x2, shot.y2); ctx.stroke();
  }
  function syncTowerButtons() {
    buttons.forEach(button => {
      const kind = kinds[button.dataset.build];
      const locked = isTowerLocked(kind);
      button.setAttribute('aria-pressed', String(button.dataset.build === selected));
      button.setAttribute('aria-disabled', locked ? 'true' : 'false');
    });
  }
  function isTowerLocked(kind) {
    return Boolean(kind.unlockAfterWin && !recovered);
  }
  reset();
})();

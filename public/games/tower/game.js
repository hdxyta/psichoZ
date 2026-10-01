(() => {
  'use strict';
  const canvas = document.getElementById('tower-canvas');
  const ctx = canvas.getContext('2d');
  const status = document.querySelector('[data-game-status]');
  const buttons = [...document.querySelectorAll('[data-build]')];
  const waveButton = document.querySelector('[data-action="wave"]');
  const W = canvas.width, H = canvas.height;
  const path = [{x:-40,y:296},{x:130,y:296},{x:130,y:142},{x:332,y:142},{x:332,y:392},{x:540,y:392},{x:540,y:204},{x:754,y:204},{x:754,y:322},{x:1008,y:322}];
  const sites = [
    {x:118,y:210},{x:220,y:356},{x:306,y:230},{x:438,y:316},{x:526,y:126},{x:650,y:286},{x:742,y:132},{x:842,y:392},
  ];
  const wavesToWin = 3;
  const kinds = {
    needle: {cost:20, range:170, rate:.34, damage:22, slow:0, color:'#f51d36'},
    chain: {cost:35, range:150, rate:.58, damage:10, slow:.45, color:'#f2ece2'},
  };
  let money, base, wave, queued, waveTimer, nextWaveDelay, selected, enemies, towers, shots, last, ended, loopId;
  function reset() {
    money = 100; base = 10; wave = 0; queued = 0; waveTimer = 0; nextWaveDelay = 0; selected = 'needle';
    enemies = []; towers = []; shots = []; last = performance.now(); ended = false;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.build === selected)));
    report('playing', 'Toque em um sigilo para erguer uma torre.');
    cancelAnimationFrame(loopId);
    loopId = requestAnimationFrame(tick);
  }
  function report(phase, hint) {
    const text = phase === 'won' ? 'Torre preservada.' : phase === 'lost' ? 'A torre caiu.' : hint;
    status.textContent = `ONDAS ${Math.min(wave, wavesToWin)} / ${wavesToWin} · ${text}`;
    window.PsicoZ?.report({phase, progress: Math.min(wave, wavesToWin), total: wavesToWin, label: 'ONDAS', hint: text});
  }
  function spawnWave() {
    if (ended || queued || wave >= wavesToWin) return;
    wave += 1;
    queued = 2 + wave;
    waveTimer = 0; nextWaveDelay = 0;
    report('playing', `Onda ${wave}. Reforce os sigilos.`);
  }
  function spawnEnemy() {
    const hp = 24 + wave * 10;
    enemies.push({x:path[0].x, y:path[0].y, node:1, hp, max:hp, speed:58 + wave * 4, slow:0});
  }
  function buildAt(x, y) {
    if (ended) return;
    const site = sites.find(point => Math.hypot(point.x - x, point.y - y) < 36);
    if (!site || site.tower) return;
    const kind = kinds[selected];
    if (money < kind.cost) { report('playing', 'Sinal insuficiente para essa torre.'); return; }
    money -= kind.cost;
    site.tower = {kind:selected, cooldown:0};
    towers.push({site, ...kind, cooldown:0});
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
    selected = button.dataset.build;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    report('playing', selected === 'needle' ? 'Torre agulha selecionada.' : 'Corrente lenta selecionada.');
  }));
  waveButton.addEventListener('click', spawnWave);
  document.addEventListener('keydown', event => {
    if (event.code === 'Digit1') buttons[0].click();
    if (event.code === 'Digit2') buttons[1].click();
    if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); spawnWave(); }
  });
  window.PsicoZ?.onPause(paused => { if (!paused) last = performance.now(); });
  function tick(time) {
    const dt = Math.min(.05, (time - last) / 1000 || 0); last = time;
    update(dt); draw();
    if (!ended) loopId = requestAnimationFrame(tick);
  }
  function update(dt) {
    if (queued) {
      waveTimer -= dt;
      if (waveTimer <= 0) { spawnEnemy(); queued -= 1; waveTimer = Math.max(.35, .82 - wave * .06); }
    }
    if (wave > 0 && wave < wavesToWin && !queued && enemies.length === 0) {
      nextWaveDelay += dt;
      if (nextWaveDelay > 2.2) spawnWave();
    }
    for (const enemy of enemies) {
      if (enemy.slow > 0) enemy.slow -= dt;
      const target = path[enemy.node];
      const speed = enemy.speed * (enemy.slow > 0 ? .56 : 1);
      const dx = target.x - enemy.x, dy = target.y - enemy.y, dist = Math.hypot(dx, dy);
      if (dist < speed * dt) {
        enemy.x = target.x; enemy.y = target.y; enemy.node += 1;
        if (enemy.node >= path.length) { enemy.dead = true; base -= 1; }
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
      if (target.hp <= 0) money += 8 + wave;
      shots.push({x1:tower.site.x, y1:tower.site.y, x2:target.x, y2:target.y, life:.12, color:tower.color});
      tower.cooldown = tower.rate;
    }
    shots.forEach(shot => shot.life -= dt);
    shots = shots.filter(shot => shot.life > 0);
    if (base <= 0) end(false);
    if (wave >= wavesToWin && !queued && enemies.length === 0) end(true);
  }
  function end(won) {
    ended = true;
    report(won ? 'won' : 'lost', won ? 'As três ondas foram contidas.' : 'A torre perdeu todo o sinal.');
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#080808'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#241015'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 120, H); ctx.stroke(); }
    ctx.strokeStyle = '#f2ece2'; ctx.lineWidth = 30; ctx.lineCap = 'square'; tracePath();
    ctx.strokeStyle = '#f51d36'; ctx.lineWidth = 4; tracePath();
    ctx.fillStyle = '#f51d36'; ctx.fillRect(856, 282, 62, 82);
    ctx.strokeStyle = '#f2ece2'; ctx.lineWidth = 3; ctx.strokeRect(866, 292, 42, 62);
    for (const site of sites) {
      ctx.save(); ctx.translate(site.x, site.y); ctx.rotate(-.2);
      ctx.strokeStyle = site.tower ? kinds[site.tower.kind].color : '#73535a'; ctx.lineWidth = 3;
      ctx.strokeRect(-19, -19, 38, 38);
      ctx.beginPath(); ctx.arc(0, 0, site.tower ? 15 : 7, 0, Math.PI * 2); ctx.stroke();
      if (site.tower) { ctx.fillStyle = kinds[site.tower.kind].color; ctx.fillRect(-5, -24, 10, 48); }
      ctx.restore();
    }
    for (const shot of shots) { ctx.strokeStyle = shot.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(shot.x1, shot.y1); ctx.lineTo(shot.x2, shot.y2); ctx.stroke(); }
    for (const enemy of enemies) {
      ctx.fillStyle = enemy.slow > 0 ? '#f2ece2' : '#f51d36';
      ctx.beginPath(); ctx.arc(enemy.x, enemy.y, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#090909'; ctx.fillRect(enemy.x - 18, enemy.y - 27, 36, 5);
      ctx.fillStyle = '#f2ece2'; ctx.fillRect(enemy.x - 18, enemy.y - 27, 36 * Math.max(0, enemy.hp / enemy.max), 5);
    }
    ctx.fillStyle = '#f2ece2'; ctx.font = '700 16px monospace';
    ctx.fillText(`SINAL ${money}`, 24, 34); ctx.fillText(`TORRE ${base}`, 24, 58); ctx.fillText(`ONDA ${Math.min(wave, wavesToWin)}/${wavesToWin}`, 24, 82);
    if (!queued && enemies.length === 0 && wave < wavesToWin && !ended) {
      ctx.fillStyle = '#f51d36'; ctx.font = '700 22px monospace'; ctx.fillText('CHAME A PROXIMA ONDA', 328, 64);
    }
  }
  function tracePath() {
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    for (const point of path.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }
  reset();
})();

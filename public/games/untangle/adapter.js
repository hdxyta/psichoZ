/* psicoZ adapter for Makzan Untangle. All graph/intersection rules and levels
 * are executed from the four original MIT files shipped alongside this one. */
(() => {
  const game = untangleGame, canvas = document.querySelector('canvas'), ctx = canvas.getContext('2d');
  const nodes = document.querySelector('.nodes'); let selected = 0, dragging = false, phase = 'playing', completed = 0;
  const keys = new Set(); game.layers = [null, null, ctx, null];
  game.updateLevelProgress = () => {
    const clear = game.lines.filter(line => line.thickness === game.thinLineThickness).length;
    game.levelProgress = Math.floor(clear / game.lines.length * 100);
  };
  function distinct() { return game.circles.every((a, i) => game.circles.every((b, j) => i === j || Math.hypot(a.x - b.x, a.y - b.y) > 42)); }
  function report() { PsicoZ.report({ phase, progress: completed, total: 2, label: 'REDES LIVRES', hint: `Rede ${Math.min(2, completed + 1)} · ${game.levelProgress}% sem cruzamentos. Selecione um nó e arraste ou use as setas.` }); }
  game.checkLevelCompleteness = () => {
    if (phase !== 'playing' || game.levelProgress !== 100 || !distinct()) return;
    completed++;
    if (completed === 2) phase = 'won';
    else { game.currentLevel = 1; game.setupCurrentLevel(); buttons(); }
    report();
  };
  function buttons() {
    nodes.replaceChildren(...game.circles.map((_, i) => {
      const button = document.createElement('button'); button.textContent = String(i + 1); button.setAttribute('aria-label', `Selecionar nó ${i + 1}`); button.onclick = () => { selected = i; updateButtons(); }; return button;
    })); updateButtons();
  }
  function updateButtons() { [...nodes.children].forEach((button, i) => button.setAttribute('aria-pressed', String(selected === i))); }
  function move(x, y) {
    if (phase !== 'playing') return; const node = game.circles[selected];
    node.x = Math.max(30, Math.min(570, x)); node.y = Math.max(30, Math.min(330, y));
    game.connectCircles(); game.updateLineIntersection(); game.updateLevelProgress(); report();
  }
  function point(event) { const r = canvas.getBoundingClientRect(); return { x: (event.clientX - r.left) / r.width * 600, y: (event.clientY - r.top) / r.height * 360 }; }
  canvas.addEventListener('pointerdown', event => { if (PsicoZ.paused) return; event.preventDefault(); canvas.setPointerCapture(event.pointerId); const p = point(event); const nearest = game.circles.findIndex(c => Math.hypot(c.x - p.x, c.y - p.y) < 35); if (nearest >= 0) selected = nearest; else move(p.x, p.y); dragging = true; updateButtons(); });
  canvas.addEventListener('pointermove', event => { if (dragging) { const p = point(event); move(p.x, p.y); } });
  canvas.addEventListener('pointerup', () => { dragging = false; game.checkLevelCompleteness(); });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  document.addEventListener('keydown', event => { if (event.key.startsWith('Arrow') && !PsicoZ.paused) { event.preventDefault(); keys.add(event.key); } });
  document.addEventListener('keyup', event => { keys.delete(event.key); game.checkLevelCompleteness(); });
  PsicoZ.onPause(() => { keys.clear(); dragging = false; });
  game.setupCurrentLevel(); buttons(); report();
  let last = 0;
  function draw(time) {
    const dt = last ? Math.min(.04, (time - last) / 1000) : 0; last = time;
    const dx = Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft')), dy = Number(keys.has('ArrowDown')) - Number(keys.has('ArrowUp'));
    if (dx || dy) move(game.circles[selected].x + dx * dt * 140, game.circles[selected].y + dy * dt * 140);
    ctx.fillStyle = '#090909'; ctx.fillRect(0, 0, 600, 360); ctx.strokeStyle = '#281c21'; ctx.lineWidth = 1;
    for (let x = -360; x < 600; x += 18) { ctx.beginPath(); ctx.moveTo(x, 360); ctx.lineTo(x + 360, 0); ctx.stroke(); }
    game.lines.forEach(line => { ctx.strokeStyle = line.thickness > 1 ? '#f51d36' : '#f2ece2'; ctx.lineWidth = line.thickness > 1 ? 4 : 2; ctx.beginPath(); ctx.moveTo(line.startPoint.x, line.startPoint.y); ctx.lineTo(line.endPoint.x, line.endPoint.y); ctx.stroke(); });
    game.circles.forEach((p, i) => { ctx.fillStyle = '#090909'; ctx.beginPath(); ctx.arc(p.x + 4, p.y + 5, 23, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = i === selected ? '#f51d36' : '#f2ece2'; ctx.beginPath(); ctx.arc(p.x, p.y, 22, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#090909'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#090909'; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), p.x, p.y + 7); });
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();

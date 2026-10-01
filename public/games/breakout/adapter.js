/* psicoZ adapter. Upstream brick collision, paddle, ball and state machine remain intact. */
(() => {
  Game.loadSounds = function () {}; Breakout.playSound = function () {};
  Breakout.ontouchmove = function () {}; // Pointer coordinates below handle CSS scaling.
  Game.Runner.storage = function () { return this.localStorage ||= {}; };
  // Fixed logical court: browser CSS scales it, preserving the active attempt on resize.
  Game.Runner.resize = function () { this.canvas.width = this.width = 600; this.canvas.height = this.height = 500; this.bounds = this.canvas.getBoundingClientRect(); this.initCanvas(); };
  Breakout.Levels = [{ colors: { r: '#f51d36', w: '#f2ece2' }, bricks: ['', '', '', '', 'rrrrrRRRRRrrrrrRRRRRrrrrrRRRRR', 'wwwwwWWWWWwwwwwWWWWWwwwwwWWWWW'] }];
  Object.assign(Breakout.Defaults.color, { background: '#151113', foreground: '#f2ece2', border: '#090909', wall: '#f2ece2', ball: '#f51d36', paddle: '#f2ece2', score: '#f51d36', highscore: '#f2ece2' });
  Breakout.Defaults.ball.speed = 20;
  Object.values(Breakout.Defaults.ball.labels).forEach((label, i) => { label.text = ['VAI!', '2', '3'][i]; label.fill = '#f51d36'; });
  Breakout.Paddle.render = function (ctx) { ctx.fillStyle = '#f2ece2'; ctx.fillRect(0, 0, this.w, this.h); ctx.strokeStyle = '#090909'; ctx.lineWidth = 3; for (let x = 0; x < this.w; x += 10) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + this.h, this.h); ctx.stroke(); } };
  Game.ready(() => {
    const game = Game.start('canvas', Breakout, { width: 600, height: 500 });
    let terminal = false, phase = 'playing', total = game.court.numbricks, lostHits = 0;
    const report = () => PsicoZ.report({ phase, progress: phase === 'lost' ? lostHits : game.court.numhits, total, label: 'BLOCOS', hint: `${phase === 'lost' ? 0 : game.score.lives} vidas · quebre os ${total} blocos. Arraste, use ← / → ou os botões.` });
    game.onbeforelose = function () { lostHits = this.court.numhits; };
    game.winLevel = function () { terminal = true; phase = 'won'; this.ball.setdir(0, 0); this.ball.clearLaunch(); report(); };
    game.onlose = function () { terminal = true; phase = 'lost'; this.ball.setdir(0, 0); this.ball.clearLaunch(); report(); };
    const update = game.update; game.update = function (dt) { if (!terminal) update.call(this, Math.min(dt, .04)); report(); };
    game.onbeforeabandon = function () { return false; };
    const canvas = document.getElementById('canvas');
    const move = event => { if (terminal || PsicoZ.paused) return; const rect = canvas.getBoundingClientRect(); game.paddle.place((event.clientX - rect.left) / rect.width * game.width - game.paddle.w / 2); };
    canvas.addEventListener('pointerdown', event => { canvas.setPointerCapture(event.pointerId); move(event); game.ball.launchNow(); });
    canvas.addEventListener('pointermove', move);
    PsicoZ.onPause(() => { game.paddle.setdir(0); game.runner.lastFrame = performance.now(); });
    game.play(); report();
  });
})();

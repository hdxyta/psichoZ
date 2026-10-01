/* psicoZ adapter for Jake Gordon's MIT javascript-pong; physics and AI are upstream. */
(() => {
  Pong.Images = [];
  Pong.Menu.initialize = function () {};
  Pong.Menu.draw = function () {};
  Pong.Sounds.initialize = function (game) { this.game = game; this.supported = false; };
  Object.assign(Pong.Colors, { walls: '#f2ece2', ball: '#f51d36', score: '#f51d36' });
  Pong.onkeydown = function (code) { if ([38, 87, 81].includes(code)) this.leftPaddle.moveUp(); if ([40, 83, 65].includes(code)) this.leftPaddle.moveDown(); };
  Pong.onkeyup = function (code) { if ([38, 87, 81].includes(code)) this.leftPaddle.stopMovingUp(); if ([40, 83, 65].includes(code)) this.leftPaddle.stopMovingDown(); };
  Game.ready(function () {
    const game = Game.start('game', Pong, { stats: false, sound: false, paddleHeight: 88, paddleSpeed: 1.2, ballSpeed: 3.2, ballAccel: 5 });
    let terminal = false;
    const report = () => PsicoZ.report({ phase: game.scores[0] >= 3 ? 'won' : game.scores[1] >= 3 ? 'lost' : 'playing', progress: game.scores[0], total: 3, label: 'PONTOS', hint: `Adversário ${game.scores[1]} / 3 · primeiro a 3 vence. Arraste a raquete ou use ↑ / ↓.` });
    const update = game.update;
    game.update = function (dt) { if (terminal) return; update.call(this, Math.min(dt, .05)); terminal = game.scores.some(score => score >= 3); if (terminal) this.playing = false; report(); };
    const canvas = document.getElementById('game');
    function move(event) { if (terminal || PsicoZ.paused) return; const rect = canvas.getBoundingClientRect(); const y = (event.clientY - rect.top) / rect.height * game.height - game.leftPaddle.height / 2; game.leftPaddle.setpos(0, Math.max(game.leftPaddle.minY, Math.min(game.leftPaddle.maxY, y))); }
    canvas.addEventListener('pointerdown', event => { canvas.setPointerCapture(event.pointerId); move(event); });
    canvas.addEventListener('pointermove', move);
    PsicoZ.onPause(() => { game.leftPaddle.setdir(0); game.runner.lastFrame = performance.now(); });
    game.startSinglePlayer(); report();
  });
})();

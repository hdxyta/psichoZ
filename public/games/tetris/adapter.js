/* psicoZ adapter for Jake Gordon's MIT Tetris. Bitmasks, rotation, collision, bag and line removal are upstream. */
(() => {
  [i, j, l, o, s, t, z].forEach((piece, index) => { piece.color = ['#f51d36', '#9f1026', '#b6a79b', '#f2ece2', '#ed5567', '#090909', '#6a3d42'][index]; });
  let terminal = false;
  const originalUpdate = update;
  const originalLose = lose;
  lose = function () { terminal = true; originalLose(); report('lost'); };
  function report(phase = 'playing') { PsicoZ.report({ phase, progress: rows, total: 2, label: 'LINHAS', hint: 'Complete 2 linhas. ← → move, ↑ gira, Espaço solta. Use os botões no toque ou mouse.' }); }
  update = function (elapsed) { if (terminal) return; originalUpdate(Math.min(elapsed, .05)); if (rows >= 2) { terminal = true; playing = false; report('won'); } else if (!terminal) report(); };
  const originalKeydown = keydown;
  document.removeEventListener('keydown', originalKeydown);
  document.addEventListener('keydown', event => {
    if (terminal || PsicoZ.paused || event.code === 'Escape' || event.code === 'KeyP') return;
    if (event.code === 'Space') { event.preventDefault(); hardDrop(); }
    else originalKeydown(event);
  });
  function hardDrop() { if (!playing || terminal || PsicoZ.paused) return; while (move(DIR.DOWN)) {} drop(); }
  document.getElementById('drop').addEventListener('click', hardDrop);
  const originalDrawBlock = drawBlock;
  drawBlock = function (context, x, y, color) {
    originalDrawBlock(context, x, y, color);
    context.strokeStyle = color === '#090909' ? '#f2ece2' : '#090909'; context.lineWidth = 1;
    context.beginPath(); context.moveTo(x * dx + 2, (y + 1) * dy - 2); context.lineTo((x + 1) * dx - 2, y * dy + 2); context.stroke();
  };
  PsicoZ.onPause(() => clearActions());
  speed.start = .8;
  play(); report();
})();

/* Adapted from Himanshu Varshney's MIT main.js; entity, movement and collision are upstream. */
import { config } from './src/config.js';
import Game from './src/game.js';
import InputHandler from './src/input.js';
const canvas = document.getElementById('gameCanvas');
canvas.width = canvas.height = config.grid_size * config.cell_size;
const inputHandler = new InputHandler();
const game = new Game(canvas, inputHandler);
game.init(); game.setState('playing');
let lastTime = null, terminal = false;
PsicoZ.onPause(() => { lastTime = null; inputHandler.latestKey = null; inputHandler.keys = {}; });
let origin = null;
canvas.addEventListener('pointerdown', event => { origin = { x: event.clientX, y: event.clientY }; canvas.setPointerCapture(event.pointerId); });
canvas.addEventListener('pointermove', event => {
  if (!origin || PsicoZ.paused) return;
  const dx = event.clientX - origin.x, dy = event.clientY - origin.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) return;
  inputHandler.handleKeyDown(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'ArrowRight' : 'ArrowLeft' : dy > 0 ? 'ArrowDown' : 'ArrowUp');
  origin = { x: event.clientX, y: event.clientY };
});
for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(event, () => { origin = null; });
function tick(currentTime) {
  const dt = lastTime === null ? 0 : Math.min(.05, (currentTime - lastTime) / 1000);
  if (!terminal) game.update(dt);
  game.render(dt); lastTime = currentTime;
  const score = game.scoreHandler.getScore();
  const phase = score >= 6 ? 'won' : game.gameState === 'gameOver' ? 'lost' : 'playing';
  terminal = phase !== 'playing';
  PsicoZ.report({ phase, progress: score, total: 6, label: 'GOTAS', hint: 'Recolha 6 gotas. Setas, WASD, botões ou deslize. Evite seu próprio corpo.' });
  if (!terminal) requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

import './runner.css';
import { createAudioReactiveSystem, SILENCIO_EVENTS } from './audio-reactive';

interface RunnerOptions {
  onExit(collection?: boolean): void;
  onWin(collectibles: string[]): string;
  reducedMotion(): boolean;
  setReducedMotion(value: boolean): void;
}

type RunnerScreen = 'ready' | 'playing' | 'paused' | 'won' | 'lost';
const RUN_LENGTH = 72;
const TARGET_FILES = 12;

/** Track 03 vertical slice: one reusable runner loop, with deterministic visual events. */
export function mountRunner(host: HTMLElement, options: RunnerOptions) {
  host.innerHTML = `<div class="runner-game" data-screen="ready"><canvas data-runner-canvas aria-label="Runner de Silêncio"></canvas><div class="runner-noise" aria-hidden="true"></div><header class="runner-hud"><span>PSICOZ / TRACK_03</span><strong data-runner-progress>FILE 00 / ${TARGET_FILES}</strong><span data-runner-time>01:12</span></header><p class="runner-objective" data-runner-objective>Recupere os fragmentos antes que o arquivo corrompa.</p><p class="runner-notice" data-runner-notice role="status"></p><div class="runner-touch"><button type="button" data-jump aria-label="Pular">PULAR</button></div><section class="runner-overlay"><div class="runner-card"><p class="section-label">psicoZ / microexperiência</p><h2>Silêncio</h2><strong>RUN // RECUPERAR MEMÓRIA</strong><p data-runner-description>O arquivo está caindo em silêncio. Corra, pule as falhas e recupere doze fragmentos antes do colapso.</p><p class="runner-controls">Espaço, clique ou toque para pular. A corrida é automática.</p><div class="runner-result" hidden><strong data-runner-result></strong><p data-runner-save></p></div><div class="runner-actions"><button type="button" class="button primary" data-runner-start>Entrar no arquivo</button><button type="button" class="button secondary" data-runner-restart hidden>Recomeçar</button><button type="button" class="text-link" data-runner-exit>Voltar à home</button></div></div></section></div>`;
  const root = host.querySelector<HTMLElement>('.runner-game')!;
  const canvas = root.querySelector<HTMLCanvasElement>('[data-runner-canvas]')!;
  const ctx = canvas.getContext('2d')!;
  const overlay = root.querySelector<HTMLElement>('.runner-overlay')!;
  const startButton = root.querySelector<HTMLButtonElement>('[data-runner-start]')!;
  const restartButton = root.querySelector<HTMLButtonElement>('[data-runner-restart]')!;
  const abort = new AbortController();
  let screen: RunnerScreen = 'ready'; let frame = 0; let last = 0; let elapsed = 0; let files = 0; let jumps = 0; let spawn = .8; let playerY = 0; let velocity = 0; let obstacleX = 1.1; let obstacleHeight = .18; let glitch = 0; let disposed = false; let reduced = options.reducedMotion();
  const reactive = createAudioReactiveSystem(SILENCIO_EVENTS, (event) => { glitch = Math.max(glitch, event.intensity ?? .5); if (event.type === 'surge') notice('PULSO DETECTADO — mantenha o ritmo'); });
  const notice = (value: string) => { root.querySelector<HTMLElement>('[data-runner-notice]')!.textContent = value; };
  const resize = () => { const ratio = Math.min(2, window.devicePixelRatio || 1); const rect = canvas.getBoundingClientRect(); canvas.width = Math.max(1, Math.round(rect.width * ratio)); canvas.height = Math.max(1, Math.round(rect.height * ratio)); ctx.setTransform(ratio, 0, 0, ratio, 0, 0); };
  const draw = () => {
    const width = canvas.clientWidth; const height = canvas.clientHeight; const ground = height * .78; ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#090707'; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#3d1720'; ctx.lineWidth = 1; for (let y = 18; y < ground; y += 18) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
    ctx.fillStyle = '#b71931'; ctx.fillRect(0, ground, width, 4); ctx.fillStyle = '#5f1624'; ctx.fillRect(0, ground + 4, width, 2);
    const px = width * .18; const py = ground - 48 - playerY; ctx.fillStyle = '#f4eee8'; ctx.fillRect(px, py, 26, 48); ctx.fillStyle = '#ef233c'; ctx.fillRect(px + 5, py + 8, 16, 4); ctx.fillStyle = '#090707'; ctx.fillRect(px + 4, py + 20, 19, 4);
    const ox = obstacleX * width; const oh = height * obstacleHeight; ctx.fillStyle = '#ef233c'; ctx.fillRect(ox, ground - oh, 28, oh); ctx.strokeStyle = '#f4eee8'; ctx.strokeRect(ox + .5, ground - oh + .5, 27, oh - 1);
    for (let i = 0; i < files; i++) { const fx = width * (.32 + i * .055); const fy = ground - 15 - Math.sin(elapsed * 4 + i) * 3; ctx.fillStyle = i < files ? '#ff4054' : '#f4eee8'; ctx.fillRect(fx, fy, 8, 8); }
    if (!reduced && screen === 'playing') { ctx.globalAlpha = .16 + glitch * .22; ctx.fillStyle = '#ef233c'; ctx.fillRect((elapsed * 180) % width, 0, 2 + glitch * 7, height); ctx.globalAlpha = 1; }
  };
  const updateHud = () => { root.querySelector<HTMLElement>('[data-runner-progress]')!.textContent = `FILE ${String(files).padStart(2, '0')} / ${TARGET_FILES}`; const left = Math.max(0, RUN_LENGTH - elapsed); root.querySelector<HTMLElement>('[data-runner-time]')!.textContent = `00:${String(Math.ceil(left)).padStart(2, '0')}`; root.querySelector<HTMLElement>('[data-runner-objective]')!.textContent = files >= TARGET_FILES ? 'Arquivo completo. Saída encontrada.' : `Recupere ${TARGET_FILES - files} fragmentos antes do colapso.`; };
  const show = (next: RunnerScreen) => { screen = next; root.dataset.screen = next; overlay.hidden = next === 'playing'; root.querySelector<HTMLElement>('.runner-touch')!.hidden = next !== 'playing'; startButton.hidden = !(next === 'ready' || next === 'paused'); restartButton.hidden = !(next === 'lost' || next === 'won'); root.querySelector<HTMLElement>('.runner-result')!.hidden = next !== 'won'; if (next !== 'playing') cancelAnimationFrame(frame); if (next === 'won') { root.querySelector<HTMLElement>('[data-runner-result]')!.textContent = 'TRACK RECOVERED'; root.querySelector<HTMLElement>('[data-runner-save]')!.textContent = options.onWin(['silencio-fragments']); } updateHud(); };
  const jump = () => { if (screen !== 'playing' || playerY > 1) return; velocity = 7.7; jumps++; };
  const reset = () => { elapsed = 0; files = 0; jumps = 0; playerY = 0; velocity = 0; spawn = .8; obstacleX = 1.1; obstacleHeight = .18; glitch = 0; reactive.reset(); root.querySelector<HTMLElement>('[data-runner-result]')!.textContent = ''; show('ready'); draw(); };
  const tick = (time: number) => { if (disposed || screen !== 'playing') return; const dt = Math.min(.04, Math.max(0, (time - last) / 1000)); last = time; elapsed += dt; reactive.update(elapsed); glitch = Math.max(0, glitch - dt * 1.8); playerY += velocity * dt; velocity -= 19 * dt; if (playerY <= 0) { playerY = 0; velocity = 0; } obstacleX -= dt * (.42 + elapsed / 160); spawn -= dt; if (spawn <= 0) { obstacleX = 1.05; obstacleHeight = .16 + ((Math.floor(elapsed * 10) % 3) * .045); spawn = .95 + ((Math.floor(elapsed * 7) % 4) * .18); } if (obstacleX < .24 && obstacleX > .15 && playerY < obstacleHeight * canvas.clientHeight * .78 - 30) { notice('ARQUIVO CORROMPIDO — tente novamente'); show('lost'); return; } const collected = Math.floor(elapsed / 5.2); if (collected > files) { files = Math.min(TARGET_FILES, collected); if (files === TARGET_FILES) { show('won'); return; } } if (elapsed >= RUN_LENGTH) { show(files >= TARGET_FILES ? 'won' : 'lost'); return; } updateHud(); draw(); frame = requestAnimationFrame(tick); };
  const start = () => { if (screen === 'won' || screen === 'lost') reset(); show('playing'); last = performance.now(); frame = requestAnimationFrame(tick); };
  startButton.addEventListener('click', start, { signal: abort.signal }); restartButton.addEventListener('click', reset, { signal: abort.signal }); root.querySelector('[data-runner-exit]')!.addEventListener('click', () => options.onExit(), { signal: abort.signal }); root.querySelector('[data-jump]')!.addEventListener('pointerdown', (event) => { event.preventDefault(); jump(); }, { signal: abort.signal }); canvas.addEventListener('pointerdown', (event) => { event.preventDefault(); jump(); }, { signal: abort.signal }); window.addEventListener('keydown', (event) => { if (event.code === 'Space' || event.code === 'ArrowUp') { event.preventDefault(); jump(); } if (event.code === 'Escape' && screen === 'playing') show('paused'); }, { signal: abort.signal }); window.addEventListener('resize', () => { resize(); draw(); }, { signal: abort.signal }); resize(); draw(); show('ready');
  return { pause: () => { if (screen === 'playing') show('paused'); }, dispose: () => { disposed = true; cancelAnimationFrame(frame); abort.abort(); host.replaceChildren(); } };
}

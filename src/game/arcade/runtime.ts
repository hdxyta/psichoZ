import './arcade.css';
import { VIEW_WIDTH, VIEW_HEIGHT, type ArcadeConfig, type ArcadeEngine, type ArcadeInput } from './types';

export interface ArcadeOptions {
  onExit(collection?: boolean): void;
  onWin(collectibles: string[]): string;
  reducedMotion(): boolean;
  setReducedMotion(value: boolean): void;
}
type Screen = 'ready' | 'playing' | 'paused' | 'won' | 'lost';
const boardKinds = new Set(['memory', 'circuit', 'rhythm', 'sequence', 'finale']);

export async function mountArcade(host: HTMLElement, config: ArcadeConfig, options: ArcadeOptions) {
  const factory = boardKinds.has(config.kind) ? (await import('./puzzles')).createPuzzleEngine
    : ['runner', 'platform', 'drive', 'chase'].includes(config.kind) ? (await import('./action')).createActionEngine
      : ['explore', 'maze'].includes(config.kind) ? (await import('./world')).createExploreEngine
        : (await import('./world')).createCombatEngine;
  return mountArcadeWithFactory(host, config, options, factory);
}

/** Owns the lifecycle and input. Engines cannot write progress or create a victory externally. */
function mountArcadeWithFactory(host: HTMLElement, config: ArcadeConfig, options: ArcadeOptions, factory: (config: ArcadeConfig) => ArcadeEngine) {
  const board = boardKinds.has(config.kind);
  const combat = ['arena', 'boss'].includes(config.kind);
  const exploration = ['explore', 'maze'].includes(config.kind);
  host.innerHTML = `<div class="arcade-game" data-screen="ready" data-kind="${config.kind}">
    <header class="arcade-header"><div><span class="arcade-kicker">PSICOZ / ${config.trackId.replace('-', ' ')}</span><strong data-track-title></strong></div><div class="arcade-score"><span data-score></span><time data-time></time></div><button type="button" data-pause aria-label="Pausar partida">Ⅱ</button><button type="button" data-exit aria-label="Fechar jogo">×</button></header>
    <div class="arcade-stage"><canvas width="960" height="540" tabindex="0" aria-label="Área do jogo"></canvas><div class="arcade-board" data-board></div></div>
    <div class="arcade-footer"><p data-hint></p><div class="arcade-controls" aria-label="Controles do jogo"><div class="arcade-dpad"><button type="button" data-move="up" aria-label="Mover para cima">↑</button><button type="button" data-move="left" aria-label="Mover para esquerda">←</button><button type="button" data-move="down" aria-label="Mover para baixo">↓</button><button type="button" data-move="right" aria-label="Mover para direita">→</button></div><div class="arcade-actions"><button type="button" data-primary></button><button type="button" data-secondary>Dash</button></div></div><span class="arcade-help" data-help></span></div>
    <div class="arcade-overlay"><section class="arcade-menu" aria-labelledby="arcade-menu-title"><p class="arcade-kicker" data-kicker></p><h2 id="arcade-menu-title"></h2><strong data-subtitle></strong><p data-description></p><p class="arcade-instructions" data-instructions></p><p class="arcade-result" role="status" data-result hidden></p><div class="arcade-menu-actions"><button type="button" class="button primary" data-start>Jogar</button><button type="button" class="button primary" data-collection hidden>Ver minha coleção</button><button type="button" class="button secondary" data-restart hidden>Recomeçar fase</button><button type="button" class="text-link" data-menu-exit>Voltar aos jogos</button></div><p class="arcade-pending">Primeira versão jogável · música a publicar.</p><label class="arcade-motion"><input type="checkbox" data-motion> Reduzir movimento</label></section></div>
  </div>`;
  const root = host.querySelector<HTMLElement>('.arcade-game')!;
  const q = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const canvas = q<HTMLCanvasElement>('canvas');
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas indisponível');
  const overlay = q('.arcade-overlay'), boardHost = q('[data-board]'), controls = q('.arcade-controls');
  const start = q<HTMLButtonElement>('[data-start]'), restart = q<HTMLButtonElement>('[data-restart]'), collection = q<HTMLButtonElement>('[data-collection]');
  const primary = q<HTMLButtonElement>('[data-primary]');
  q('[data-track-title]').textContent = config.title;
  q('#arcade-menu-title').textContent = config.title;
  q('[data-kicker]').textContent = `FASE ${config.trackId.slice(-2)} / ${config.subtitle}`;
  q('[data-subtitle]').textContent = config.objective;
  q('[data-description]').textContent = 'Conclua o desafio para recuperar esta faixa na sua coleção. Seu progresso fica salvo neste navegador.';
  q('[data-instructions]').textContent = config.instructions;
  q('[data-help]').textContent = board ? 'Clique, toque ou use Tab + Enter nos controles. P / Esc pausa.' : config.instructions;
  primary.textContent = combat ? 'Disparar' : config.kind === 'drive' ? 'Acelerar' : 'Pular';
  primary.hidden = board || exploration || config.kind === 'drive';
  q('[data-secondary]').hidden = !['platform', 'chase'].includes(config.kind);
  controls.hidden = board;
  q<HTMLInputElement>('[data-motion]').checked = options.reducedMotion();
  canvas.setAttribute('aria-label', `${config.title}: ${config.objective}`);
  let engine = factory(config), unmountBoard = engine.mountControls?.(boardHost);
  let screen: Screen = 'ready', elapsed = 0, frame = 0, last = 0, accumulator = 0, disposed = false, awarded = false;
  const keys = new Set<string>(); const directions = new Map<number, string>(); const holds = new Set<number>();
  const input: ArcadeInput = { x: 0, y: 0, primary: false, secondary: false, pointer: null, click: false };
  let pointerHeld = false;
  const abort = new AbortController(); const listen = (target: EventTarget, name: string, fn: EventListener) => target.addEventListener(name, fn, { signal: abort.signal });
  function clearInput() { keys.clear(); directions.clear(); holds.clear(); pointerHeld = false; Object.assign(input, { x: 0, y: 0, primary: false, secondary: false, pointer: null, click: false }); }
  function setScreen(next: Screen) {
    screen = next; root.dataset.screen = screen; clearInput(); accumulator = 0; last = 0;
    overlay.hidden = screen === 'playing'; boardHost.inert = screen !== 'playing'; controls.inert = screen !== 'playing';
    q<HTMLButtonElement>('[data-pause]').disabled = screen !== 'playing';
    start.hidden = ['won', 'lost'].includes(screen); restart.hidden = screen === 'ready'; collection.hidden = screen !== 'won';
    start.textContent = screen === 'paused' ? 'Continuar partida' : 'Jogar';
    q('#arcade-menu-title').textContent = screen === 'paused' ? 'Pausa' : screen === 'won' ? 'Faixa recuperada' : screen === 'lost' ? 'Sinal perdido' : config.title;
    q('[data-instructions]').hidden = screen === 'won';
    if (screen === 'playing') canvas.focus();
    else (screen === 'won' ? collection : screen === 'lost' ? restart : start).focus();
  }
  function reset() {
    unmountBoard?.(); boardHost.replaceChildren(); engine = factory(config); unmountBoard = engine.mountControls?.(boardHost);
    elapsed = 0; awarded = false; q('[data-result]').hidden = true; setScreen('playing'); renderHud();
  }
  function finish(won: boolean) {
    setScreen(won ? 'won' : 'lost');
    const result = q('[data-result]'); result.hidden = false;
    if (won && !awarded) {
      awarded = true;
      result.textContent = `${options.onWin([`${config.trackId}-recovered`])} O MP3 continua aguardando publicação.`;
    } else result.textContent = elapsed >= config.duration ? 'O tempo acabou. Tente novamente: a rota e os desafios continuam os mesmos.' : 'Você perdeu esta tentativa. Recomece para recuperar a faixa.';
  }
  function renderHud() {
    const state = engine.status();
    q('[data-score]').textContent = `${state.label} ${state.progress} / ${state.total}`;
    const remaining = Math.max(0, Math.ceil(config.duration - elapsed));
    q('[data-time]').textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
    q('[data-hint]').textContent = state.hint;
  }
  function tick(now: number) {
    if (disposed) return;
    const dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
    if (screen === 'playing') {
      accumulator += dt;
      const held = new Set(directions.values());
      input.x = Number(keys.has('d') || keys.has('arrowright') || held.has('right')) - Number(keys.has('a') || keys.has('arrowleft') || held.has('left'));
      input.y = Number(keys.has('s') || keys.has('arrowdown') || held.has('down')) - Number(keys.has('w') || keys.has('arrowup') || held.has('up'));
      while (accumulator >= 1 / 120 && screen === 'playing') {
        if (combat && (pointerHeld || holds.size || keys.has(' '))) input.primary = true;
        engine.update(1 / 120, input); elapsed += 1 / 120; accumulator -= 1 / 120;
        input.primary = false; input.secondary = false; input.click = false;
        const status = engine.status();
        if (status.phase !== 'playing') finish(status.phase === 'won');
        else if (elapsed >= config.duration) finish(false);
      }
    }
    ctx!.setTransform(canvas.width / VIEW_WIDTH, 0, 0, canvas.height / VIEW_HEIGHT, 0, 0);
    engine.draw(ctx!, elapsed, options.reducedMotion());
    if (combat && input.pointer && screen === 'playing') { ctx!.strokeStyle = '#f2ece2'; ctx!.lineWidth = 2; const { x, y } = input.pointer; ctx!.strokeRect(x - 8, y - 8, 16, 16); }
    renderHud(); frame = requestAnimationFrame(tick);
  }
  const resize = new ResizeObserver(() => {
    const dpr = Math.min(devicePixelRatio || 1, 2); const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr)); canvas.height = Math.max(1, Math.round(rect.height * dpr));
  }); resize.observe(canvas);
  function pointerPosition(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width * VIEW_WIDTH, y: (event.clientY - rect.top) / rect.height * VIEW_HEIGHT };
  }
  listen(canvas, 'pointerdown', ((e: PointerEvent) => {
    if (screen !== 'playing' || e.button > 0) return;
    e.preventDefault(); canvas.setPointerCapture(e.pointerId); canvas.focus(); input.pointer = pointerPosition(e); input.click = true; pointerHeld = true;
  }) as EventListener);
  listen(canvas, 'pointermove', ((e: PointerEvent) => { if (screen === 'playing' && (pointerHeld || combat && e.pointerType === 'mouse')) input.pointer = pointerPosition(e); }) as EventListener);
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(canvas, name, (() => { pointerHeld = false; if (exploration) input.pointer = null; }) as EventListener);
  const gameKeys = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift']);
  listen(window, 'keydown', ((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key === 'p' || key === 'escape') { if (screen === 'playing') { e.preventDefault(); setScreen('paused'); } return; }
    if (screen !== 'playing' || !gameKeys.has(key) || e.target instanceof HTMLInputElement || key === ' ' && e.target instanceof HTMLButtonElement) return;
    e.preventDefault(); keys.add(key);
    if (!e.repeat) { if (key === ' ') input.primary = true; if (key === 'shift') input.secondary = true; }
  }) as EventListener);
  listen(window, 'keyup', ((e: KeyboardEvent) => { keys.delete(e.key.toLowerCase()); }) as EventListener);
  root.querySelectorAll<HTMLButtonElement>('[data-move]').forEach(button => {
    listen(button, 'pointerdown', ((e: PointerEvent) => { if (screen !== 'playing') return; e.preventDefault(); button.setPointerCapture(e.pointerId); directions.set(e.pointerId, button.dataset.move!); input.pointer = null; }) as EventListener);
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(button, name, ((e: PointerEvent) => { directions.delete(e.pointerId); }) as EventListener);
  });
  listen(primary, 'pointerdown', ((e: PointerEvent) => { if (screen !== 'playing') return; e.preventDefault(); primary.setPointerCapture(e.pointerId); input.primary = true; input.pointer = null; holds.add(e.pointerId); }) as EventListener);
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(primary, name, ((e: PointerEvent) => { holds.delete(e.pointerId); }) as EventListener);
  listen(primary, 'click', (() => { if (screen === 'playing') { input.primary = true; input.pointer = null; } }) as EventListener);
  listen(q('[data-secondary]'), 'click', (() => { if (screen === 'playing') input.secondary = true; }) as EventListener);
  listen(start, 'click', (() => setScreen('playing')) as EventListener);
  listen(restart, 'click', reset as EventListener);
  listen(collection, 'click', (() => options.onExit(true)) as EventListener);
  for (const selector of ['[data-exit]', '[data-menu-exit]']) listen(q(selector), 'click', (() => options.onExit()) as EventListener);
  const pause = () => { if (screen === 'playing') setScreen('paused'); };
  listen(q('[data-pause]'), 'click', pause as EventListener); listen(window, 'blur', pause as EventListener);
  listen(document, 'visibilitychange', (() => { if (document.hidden) pause(); }) as EventListener);
  listen(q('[data-motion]'), 'change', (() => options.setReducedMotion(q<HTMLInputElement>('[data-motion]').checked)) as EventListener);
  setScreen('ready'); renderHud(); frame = requestAnimationFrame(tick);
  return { pause, dispose() { disposed = true; cancelAnimationFrame(frame); abort.abort(); resize.disconnect(); clearInput(); unmountBoard?.(); root.remove(); } };
}

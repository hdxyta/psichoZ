/* psicoZ integration bridge. Original game rules remain in each credited folder. */
(() => {
  'use strict';
  const token = new URLSearchParams(location.search).get('session');
  document.documentElement.dataset.reducedMotion = String(new URLSearchParams(location.search).get('motion') === 'reduce');
  const nativeNow = performance.now.bind(performance);
  const dateOrigin = Date.now() - nativeNow();
  const raf = window.requestAnimationFrame.bind(window), caf = window.cancelAnimationFrame.bind(window);
  const interval = window.setInterval.bind(window);
  let paused = false, pausedAt = 0, pausedTotal = 0, nextId = 1, lastReport = '';
  const now = () => (paused ? pausedAt : nativeNow()) - pausedTotal;
  const timers = new Map(), frames = new Map(), pauseListeners = new Set(), held = new Set();
  Object.defineProperty(performance, 'now', { configurable: true, value: now });
  Date.now = () => Math.floor(dateOrigin + now());
  function post(payload) { if (parent !== window) parent.postMessage({ type: 'psicoz-game', token, ...payload }, location.origin); }
  function request(callback) {
    const id = nextId++; const entry = { callback, native: null }; frames.set(id, entry);
    function run() { if (paused) { entry.native = null; return; } frames.delete(id); callback(now()); }
    if (!paused) entry.native = raf(run);
    return id;
  }
  window.requestAnimationFrame = request;
  window.cancelAnimationFrame = id => { const frame = frames.get(id); if (frame?.native) caf(frame.native); frames.delete(id); };
  function schedule(fn, delay = 0, repeat = false, args) {
    if (typeof fn !== 'function') throw new TypeError('Only function timers are supported');
    const id = nextId++; timers.set(id, { fn, delay: Math.max(4, Number(delay) || 0), next: now() + Math.max(4, Number(delay) || 0), repeat, args }); return id;
  }
  window.setTimeout = (fn, delay, ...args) => schedule(fn, delay, false, args);
  window.setInterval = (fn, delay, ...args) => schedule(fn, delay, true, args);
  window.clearTimeout = window.clearInterval = id => timers.delete(id);
  interval(() => {
    if (paused) return;
    const time = now();
    for (const [id, timer] of [...timers]) if (timers.has(id) && time >= timer.next) {
      if (timer.repeat) timer.next = time + timer.delay; else timers.delete(id);
      timer.fn(...timer.args);
    }
  }, 8);
  const keyCodes = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Space: 32, Enter: 13, Escape: 27, KeyW: 87, KeyA: 65, KeyS: 83, KeyD: 68, ShiftLeft: 16 };
  function key(code, down) {
    const key = code === 'Space' ? ' ' : code.startsWith('Key') ? code.slice(3).toLowerCase() : code;
    if (down) held.add(code); else held.delete(code);
    document.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key, keyCode: keyCodes[code] || 0, which: keyCodes[code] || 0, bubbles: true, cancelable: true }));
  }
  function setPaused(value) {
    if (value === paused) return;
    if (value) { pausedAt = nativeNow(); for (const code of [...held]) key(code, false); paused = true; }
    else { pausedTotal += nativeNow() - pausedAt; paused = false; for (const [id, entry] of frames) if (!entry.native) entry.native = raf(() => { if (paused) { entry.native = null; return; } frames.delete(id); entry.callback(now()); }); }
    document.documentElement.dataset.paused = String(paused);
    for (const listener of pauseListeners) listener(paused);
  }
  window.PsicoZ = {
    report(status) {
      if (!status || !['playing', 'won', 'lost'].includes(status.phase)) return;
      const payload = { phase: status.phase, progress: Math.max(0, Number(status.progress) || 0), total: Math.max(1, Number(status.total) || 1), label: String(status.label || 'PROGRESSO'), hint: String(status.hint || '') };
      const serialized = JSON.stringify(payload); if (serialized === lastReport) return; lastReport = serialized;
      const text = document.querySelector('[data-game-status]'); if (text) text.textContent = `${payload.label} ${payload.progress} / ${payload.total} · ${payload.hint}`;
      post(payload);
    },
    onPause(fn) { pauseListeners.add(fn); return () => pauseListeners.delete(fn); }, key, get paused() { return paused; },
  };
  addEventListener('message', event => { if (event.source !== parent || event.origin !== location.origin || event.data?.token !== token) return; if (event.data.type === 'psicoz-command') setPaused(Boolean(event.data.paused)); });
  addEventListener('keydown', event => { if (['Escape', 'KeyP'].includes(event.code)) { event.preventDefault(); post({ request: 'pause' }); } });
  addEventListener('error', event => post({ error: String(event.message || 'Falha ao executar o jogo') }));
  addEventListener('unhandledrejection', () => post({ error: 'Falha ao iniciar um recurso do jogo' }));
  const pointers = new Map();
  addEventListener('pointerdown', event => { const button = event.target.closest?.('[data-key]'); if (!button || paused) return; event.preventDefault(); button.setPointerCapture(event.pointerId); pointers.set(event.pointerId, button.dataset.key); key(button.dataset.key, true); });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) addEventListener(name, event => { const code = pointers.get(event.pointerId); pointers.delete(event.pointerId); if (code && ![...pointers.values()].includes(code)) key(code, false); });
  addEventListener('blur', () => { for (const code of [...held]) key(code, false); });
})();

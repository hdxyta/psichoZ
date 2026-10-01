import type { GameInput } from './model';

export type ControlMode = 'mouse' | 'touch' | 'drag' | 'keyboard';

/** Physical controls only. Each finger owns its action; menus never feed the simulation. */
export function createInput(root: HTMLElement, canvas: HTMLCanvasElement, onPause: () => void, onScan: () => void = () => {}) {
  const abort = new AbortController();
  const options = { signal: abort.signal };
  const keys = new Set<string>();
  let mode: ControlMode = navigator.maxTouchPoints > 0 && matchMedia('(pointer: coarse)').matches ? 'touch' : 'mouse';
  let active = false;
  let disposed = false;
  let mouseFire = false;
  let mouseLook = false;
  let queuedFire = false;
  let fireId: number | null = null;
  let interact = false;
  let dx = 0; let dy = 0;
  let moveX = 0; let moveY = 0;
  let joystickId: number | null = null;
  let lookId: number | null = null;
  let lastX = 0; let lastY = 0;
  let stickX = 0; let stickY = 0;
  let finishLock: ((locked: boolean) => void) | null = null;
  const captures = new Map<number, HTMLElement>();
  const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyE', 'Space', 'PageUp', 'PageDown']);
  const moveZone = root.querySelector<HTMLElement>('[data-move-zone]')!;
  const joystick = root.querySelector<HTMLElement>('[data-joystick]')!;
  const knob = joystick.querySelector<HTMLElement>('span')!;
  const lookZone = root.querySelector<HTMLElement>('[data-look-zone]')!;
  const fire = root.querySelector<HTMLElement>('[data-fire]')!;
  function resetStick() { moveX = 0; moveY = 0; moveZone.dataset.active = 'false'; knob.style.transform = ''; joystick.style.left = ''; joystick.style.top = ''; }
  function clear() {
    keys.clear(); mouseFire = false; mouseLook = false; queuedFire = false;
    fireId = null; interact = false; dx = 0; dy = 0; joystickId = null; lookId = null; resetStick();
    for (const [id, element] of captures) if (element.hasPointerCapture(id)) element.releasePointerCapture(id);
    captures.clear();
  }
  function capture(event: PointerEvent) {
    const element = event.currentTarget as HTMLElement;
    element.setPointerCapture(event.pointerId); captures.set(event.pointerId, element);
  }
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Escape' && finishLock) { onPause(); return; }
    if (!active) return;
    if (event.code === 'KeyQ' && !event.repeat) { event.preventDefault(); onScan(); return; }
    if (event.code === 'Escape' || event.code === 'KeyP') { event.preventDefault(); onPause(); return; }
    if (movementKeys.has(event.code)) {
      event.preventDefault(); keys.add(event.code);
      if (event.code === 'KeyE' && !event.repeat) interact = true;
      if (event.code === 'Space' && !event.repeat) queuedFire = true;
    }
  }, options);
  window.addEventListener('keyup', (event) => { keys.delete(event.code); }, options);
  // Mouse events preserve button chords: pointerdown only fires for the first button.
  canvas.addEventListener('mousedown', (event) => {
    if (!active || mode === 'touch') return;
    if (event.button === 0) { mouseFire = true; queuedFire = true; }
    if (event.button === 2 && mode === 'drag') { mouseLook = true; lastX = event.clientX; lastY = event.clientY; }
  }, options);
  window.addEventListener('mouseup', (event) => {
    if (event.button === 0) mouseFire = false;
    if (event.button === 2) mouseLook = false;
  }, options);
  document.addEventListener('mousemove', (event) => {
    if (!active) return;
    if (mode === 'mouse' && document.pointerLockElement === canvas) { dx += event.movementX; dy += event.movementY; }
    else if (mode === 'drag' && mouseLook) {
      dx += event.clientX - lastX; dy += event.clientY - lastY; lastX = event.clientX; lastY = event.clientY;
    }
  }, options);
  canvas.addEventListener('contextmenu', (event) => event.preventDefault(), options);
  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === canvas;
    if (finishLock) { finishLock(locked); return; }
    if (locked && (!active || mode !== 'mouse')) document.exitPointerLock();
    else if (!locked && active && mode === 'mouse') onPause();
  }, options);
  document.addEventListener('pointerlockerror', () => finishLock?.(false), options);
  const lookMove = (event: PointerEvent) => {
    if (!active || event.pointerId !== lookId) return;
    dx += event.clientX - lastX; dy += event.clientY - lastY;
    lastX = event.clientX; lastY = event.clientY;
  };
  const beginLook = (event: PointerEvent) => {
    if (lookId !== null) return;
    lookId = event.pointerId; lastX = event.clientX; lastY = event.clientY;
  };
  lookZone.addEventListener('pointerdown', (event) => {
    if (!active || mode !== 'touch' || lookId !== null) return;
    event.preventDefault(); beginLook(event); capture(event);
  }, options);
  lookZone.addEventListener('pointermove', lookMove, options);
  function updateStick(event: PointerEvent) {
    const radius = joystick.clientWidth * .34;
    const x = (event.clientX - stickX) / radius; const y = (event.clientY - stickY) / radius;
    const length = Math.hypot(x, y);
    const strength = length < .12 ? 0 : Math.min(1, (length - .12) / .88);
    moveX = length ? x / length * strength : 0; moveY = length ? y / length * strength : 0;
    knob.style.transform = `translate(${moveX * radius}px, ${moveY * radius}px)`;
  }
  moveZone.addEventListener('pointerdown', (event) => {
    if (!active || mode !== 'touch' || joystickId !== null) return;
    event.preventDefault(); joystickId = event.pointerId; moveZone.dataset.active = 'true';
    const box = moveZone.getBoundingClientRect(); const radius = joystick.clientWidth / 2;
    const x = Math.max(radius, Math.min(box.width - radius, event.clientX - box.left));
    const y = Math.max(radius, Math.min(box.height - radius, event.clientY - box.top));
    joystick.style.left = `${x}px`; joystick.style.top = `${y}px`;
    stickX = box.left + x; stickY = box.top + y; capture(event); updateStick(event);
  }, options);
  moveZone.addEventListener('pointermove', (event) => { if (active && event.pointerId === joystickId) updateStick(event); }, options);
  const endPointer = (event: PointerEvent) => {
    captures.delete(event.pointerId);
    if (event.pointerId === joystickId) { joystickId = null; resetStick(); }
    if (event.pointerId === lookId) lookId = null;
    if (event.pointerId === fireId) { fireId = null; if (event.type !== 'pointerup') queuedFire = false; }
  };
  window.addEventListener('pointerup', endPointer, options);
  window.addEventListener('pointercancel', endPointer, options);
  root.addEventListener('lostpointercapture', endPointer, options);
  fire.addEventListener('pointerdown', (event) => {
    if (!active || mode !== 'touch' || fireId !== null) return;
    event.preventDefault(); fireId = event.pointerId; queuedFire = true; beginLook(event); capture(event);
  }, options);
  fire.addEventListener('pointermove', lookMove, options);
  const action = root.querySelector<HTMLElement>('[data-interact]')!;
  action.addEventListener('pointerdown', (event) => { if (active) { event.preventDefault(); interact = true; } }, options);
  action.addEventListener('click', (event) => { if (active && event.detail === 0) interact = true; }, options);
  window.addEventListener('blur', () => { if (active || finishLock) onPause(); clear(); }, options);
  window.addEventListener('resize', clear, options);

  return {
    get touch() { return mode === 'touch'; },
    get mode() { return mode; },
    setMode(value: ControlMode) { finishLock?.(false); clear(); mode = value; root.dataset.touch = String(mode === 'touch'); root.dataset.controls = mode; },
    setActive(value: boolean) { active = value; clear(); if (!value) finishLock?.(false); },
    lock(): Promise<boolean> {
      if (disposed || mode !== 'mouse' || !canvas.requestPointerLock) return Promise.resolve(false);
      if (document.pointerLockElement === canvas) return Promise.resolve(true);
      finishLock?.(false);
      return new Promise((resolve) => {
        const finish = (locked: boolean) => { if (finishLock !== finish) return; clearTimeout(timeout); finishLock = null; resolve(locked); };
        const timeout = window.setTimeout(() => finish(false), 3000);
        finishLock = finish;
        try {
          canvas.requestPointerLock()?.then(() => {
            if ((disposed || (!active && !finishLock) || mode !== 'mouse') && document.pointerLockElement === canvas) document.exitPointerLock();
          }, () => finish(false));
        }
        catch { finish(false); }
      });
    },
    unlock() { finishLock?.(false); if (document.pointerLockElement === canvas) document.exitPointerLock(); },
    sample(dt: number, sensitivity: number): GameInput {
      const lookSpeed = (mode === 'touch' ? .006 : .0022) * sensitivity;
      const input = {
        forward: (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - moveY,
        strafe: (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0) + moveX,
        turn: -dx * lookSpeed + ((keys.has('ArrowLeft') ? 1 : 0) - (keys.has('ArrowRight') ? 1 : 0)) * dt * 1.65,
        look: -dy * lookSpeed + ((keys.has('PageUp') ? 1 : 0) - (keys.has('PageDown') ? 1 : 0)) * dt,
        fire: queuedFire || mouseFire || fireId !== null || keys.has('Space'), interact,
      };
      dx = 0; dy = 0; queuedFire = false; interact = false;
      return input;
    },
    dispose() { disposed = true; active = false; clear(); finishLock?.(false); abort.abort(); if (document.pointerLockElement === canvas) document.exitPointerLock(); },
  };
}

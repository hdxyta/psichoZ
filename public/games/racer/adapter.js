/* Jake Gordon's complete MIT racer: preserve projection, traffic AI, steering, collision and lap traversal. */
(() => {
  let terminal = false, travelled = 0, crashes = 0, cooldown = 0;
  // Short authored road made through upstream road-building helpers, rather than the original several-minute circuit.
  resetRoad = function () {
    segments = []; addStraight(80); addCurve(55, 1.4, 0); addStraight(70); addCurve(55, -1.4, 0); addStraight(80);
    for (let n = 25; n < segments.length; n += 35) { addSprite(n, SPRITES.BILLBOARD01, -1.5); addSprite(n, SPRITES.DEAD_TREE1, 1.7); }
    resetCars();
    segments[findSegment(playerZ).index + 2].color = COLORS.START;
    for (let n = 0; n < rumbleLength; n++) segments[segments.length - 1 - n].color = COLORS.FINISH;
    trackLength = segments.length * segmentLength;
  };
  const originalUpdate = update;
  const report = phase => PsicoZ.report({ phase, progress: Math.min(100, Math.floor(travelled / trackLength * 100)), total: 100, label: 'PERCURSO', hint: `${Math.max(0, 5 - crashes)} impactos restantes · ↑ acelera, ← → dirige, ↓ freia. Complete uma volta.` });
  update = function (dt) {
    if (terminal) return;
    const beforePosition = position, beforeSpeed = speed;
    originalUpdate(dt); cooldown = Math.max(0, cooldown - dt);
    // A real collision is identified by the original engine's instantaneous speed reduction.
    if (beforeSpeed > maxSpeed / 3 && speed < beforeSpeed * .6 && cooldown <= 0) { crashes++; cooldown = 1.2; }
    const movement = position - beforePosition;
    travelled = Math.max(0, travelled + (movement < -trackLength / 2 ? movement + trackLength : movement));
    const phase = crashes >= 5 ? 'lost' : travelled >= trackLength ? 'won' : 'playing';
    terminal = phase !== 'playing'; report(phase);
  };
  PsicoZ.onPause(() => { keyLeft = keyRight = keyFaster = keySlower = false; });
  const canvas = document.getElementById('canvas');
  let steering = false;
  const move = event => { if (!steering || terminal || PsicoZ.paused) return; const rect = canvas.getBoundingClientRect(), relative = (event.clientX - rect.left) / rect.width; keyLeft = relative < .4; keyRight = relative > .6; keyFaster = true; };
  canvas.addEventListener('pointerdown', event => { steering = true; canvas.setPointerCapture(event.pointerId); move(event); });
  canvas.addEventListener('pointermove', move);
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(name, () => { steering = false; keyLeft = keyRight = keyFaster = false; });
  startUpstreamRacer(); report('playing');
})();

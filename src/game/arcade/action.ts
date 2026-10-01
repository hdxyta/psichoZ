import { INK, PAPER, RED, VIEW_HEIGHT, VIEW_WIDTH } from './types';
import type { ArcadeConfig, ArcadeEngine, ArcadeInput, ArcadeStatus } from './types';

type Phase = ArcadeStatus['phase'];
type ActionKind = 'runner' | 'chase' | 'platform' | 'drive';
export interface ActionRect { x: number; y: number; w: number; h: number }
export interface ActionObstacle extends ActionRect { kind: 'barrier' | 'gap'; cleared: boolean }
export interface ActionFragment { x: number; y: number; collected: boolean }
export interface DriveRow { distance: number; safeLane: number; blocked: number[]; collected: boolean }
export interface ActionState {
  kind: ActionKind;
  phase: Phase;
  player: { x: number; y: number; vx: number; vy: number; grounded: boolean; facing: number };
  platforms: ActionRect[];
  obstacles: ActionObstacle[];
  fragments: ActionFragment[];
  rows: DriveRow[];
  finish: number;
  distance: number;
  collected: number;
  progress: number;
  dashRemaining: number;
  dashCooldown: number;
  lane: number;
  age: number;
  message: string;
}

const PLAYER_W = 26;
const PLAYER_H = 42;
const FLOOR = 430;
const GRAVITY = 1450;
const JUMP = 635;
const LANES = [330, 480, 630];
const NONE: ArcadeInput = { x: 0, y: 0, primary: false, secondary: false, pointer: null, click: false };

function intersects(a: ActionRect, b: ActionRect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function playerRect(state: ActionState): ActionRect {
  return { x: state.player.x - PLAYER_W / 2, y: state.player.y - PLAYER_H, w: PLAYER_W, h: PLAYER_H };
}

/** Authored, finite courses. Drawing never changes these simulation objects. */
export function createActionState(config: ArcadeConfig): ActionState {
  const kind: ActionKind = config.kind === 'drive' || config.kind === 'platform' || config.kind === 'chase' ? config.kind : 'runner';
  const state: ActionState = {
    kind, phase: 'playing', player: { x: 100, y: FLOOR, vx: 0, vy: 0, grounded: true, facing: 1 },
    platforms: [], obstacles: [], fragments: [], rows: [], finish: 0, distance: 0, collected: 0,
    progress: 0, dashRemaining: 0, dashCooldown: 0, lane: 1, age: 0, message: '',
  };
  if (kind === 'platform') {
    const heights = [430, 402, 438, 378, 415, 365, 404, 440, 398];
    state.platforms = heights.map((y, index) => ({ x: index * 540, y, w: index === 0 ? 460 : 450, h: 90 }));
    state.fragments = state.platforms.slice(1).map((p) => ({ x: p.x + 340, y: p.y - 25, collected: false }));
    // Leave a landing runway before a hazard, then room to land before its fragment.
    state.obstacles = [3, 6].map((i) => ({ x: state.platforms[i].x + 180, y: state.platforms[i].y - 35, w: 34, h: 35, kind: 'barrier', cleared: false }));
    state.finish = state.platforms[8].x + 385;
    state.message = '';
  } else if (kind === 'drive') {
    state.player.x = LANES[1];
    state.player.y = 425;
    state.player.grounded = false;
    state.rows = Array.from({ length: 16 }, (_, index) => {
      const safeLane = (index * 2) % 3;
      return { distance: 760 + index * 490, safeLane, blocked: [0, 1, 2].filter((lane) => lane !== safeLane), collected: false };
    });
    state.finish = 8900;
  } else {
    const chase = kind === 'chase';
    state.finish = chase ? 12700 : 11900;
    state.obstacles = Array.from({ length: 16 }, (_, index) => {
      const kind = index % 4 === 2 ? 'gap' : 'barrier';
      const x = 1080 + index * (chase ? 700 : 650);
      return { x, y: kind === 'gap' ? FLOOR : FLOOR - (index % 3 === 0 ? 68 : 52), w: kind === 'gap' ? 118 : 44, h: kind === 'gap' ? 130 : index % 3 === 0 ? 68 : 52, kind, cleared: false };
    });
    state.fragments = state.obstacles.map((o) => ({ x: o.x + o.w / 2, y: FLOOR - 125, collected: false }));
  }
  return state;
}

export interface ActionSimulation { state: ActionState; update(dt: number, input: ArcadeInput): void }

/** Pure simulation factory, exposed for deterministic input/collision regression tests. */
export function createActionSimulation(config: ArcadeConfig): ActionSimulation {
  const state = createActionState(config);
  let upHeld = false;
  let horizontalHeld = 0;
  let laneRepeat = 0;
  let jumpBuffer = 0;
  let coyote = 0;
  let accumulator = 0;
  let primaryQueued = false;
  let secondaryQueued = false;
  let clickQueued = false;

  const fail = (message: string) => { state.phase = 'lost'; state.message = message; };
  function sideStep(dt: number, input: ArcadeInput, jumpPressed: boolean, dashPressed: boolean) {
    const p = state.player;
    const platform = state.kind === 'platform';
    if (jumpPressed) jumpBuffer = .13;
    else jumpBuffer = Math.max(0, jumpBuffer - dt);
    coyote = p.grounded ? .09 : Math.max(0, coyote - dt);
    state.dashCooldown = Math.max(0, state.dashCooldown - dt);
    state.dashRemaining = Math.max(0, state.dashRemaining - dt);
    if (dashPressed && state.kind !== 'runner' && state.dashCooldown === 0) {
      state.dashRemaining = .14;
      state.dashCooldown = 1.2;
    }
    if (jumpBuffer > 0 && coyote > 0) {
      p.vy = -JUMP;
      p.grounded = false;
      coyote = 0;
      jumpBuffer = 0;
    }
    if (input.x !== 0 && platform) p.facing = Math.sign(input.x);
    p.vx = platform ? input.x * 220 : state.kind === 'chase' ? 230 + input.x * 45 : 220;
    if (state.dashRemaining > 0) p.vx = (platform ? p.facing : 1) * 580;
    const previousBottom = p.y;
    p.x = Math.max(PLAYER_W / 2, Math.min(state.finish + 80, p.x + p.vx * dt));
    p.vy += GRAVITY * dt;
    p.y += p.vy * dt;
    p.grounded = false;
    if (platform) {
      for (const floor of state.platforms) {
        if (p.x + PLAYER_W / 2 <= floor.x || p.x - PLAYER_W / 2 >= floor.x + floor.w) continue;
        if (p.vy >= 0 && previousBottom <= floor.y + .01 && p.y >= floor.y) {
          p.y = floor.y; p.vy = 0; p.grounded = true;
        }
      }
    } else {
      const inGap = state.obstacles.some((o) => o.kind === 'gap' && p.x > o.x && p.x < o.x + o.w);
      if (!inGap && p.vy >= 0 && previousBottom <= FLOOR + .01 && p.y >= FLOOR) {
        p.y = FLOOR; p.vy = 0; p.grounded = true;
      }
    }
    const body = playerRect(state);
    for (const obstacle of state.obstacles) {
      if (obstacle.kind === 'barrier' && intersects(body, obstacle)) { fail('A grade te alcançou. Pule um pouco antes dela.'); return; }
      if (!obstacle.cleared && p.x - PLAYER_W / 2 > obstacle.x + obstacle.w) {
        obstacle.cleared = true;
        if (!platform) state.progress++;
      }
    }
    for (const fragment of state.fragments) {
      if (!fragment.collected && intersects(body, { x: fragment.x - 16, y: fragment.y - 16, w: 32, h: 32 })) {
        fragment.collected = true;
        state.collected++;
      }
    }
    if (p.y > 600) { fail('Você caiu na falha. Salte perto da borda.'); return; }
    if (platform) state.progress = state.collected;
    state.distance = p.x;
    if (p.x >= state.finish && p.grounded) {
      if (!platform || state.collected === state.fragments.length) state.phase = 'won';
      else state.message = `Faltam ${state.fragments.length - state.collected} fragmentos. Volte e procure os olhos vermelhos.`;
    }
  }

  function driveStep(dt: number, input: ArcadeInput, clicked: boolean) {
    const direction = Math.sign(input.x);
    laneRepeat = Math.max(0, laneRepeat - dt);
    if (direction && (direction !== horizontalHeld || laneRepeat <= 0)) {
      state.lane = Math.max(0, Math.min(2, state.lane + direction));
      laneRepeat = .24;
    }
    horizontalHeld = direction;
    if (clicked && input.pointer) state.lane = Math.max(0, Math.min(2, Math.round((input.pointer.x - LANES[0]) / 150)));
    state.player.x += Math.max(-820 * dt, Math.min(820 * dt, LANES[state.lane] - state.player.x));
    state.distance += 170 * dt;
    for (const row of state.rows) {
      if (Math.abs(row.distance - state.distance) < 42) {
        if (row.blocked.some((lane) => Math.abs(state.player.x - LANES[lane]) < 49)) { fail('Colisão. Procure a faixa marcada pelo olho.'); return; }
        if (!row.collected && Math.abs(state.player.x - LANES[row.safeLane]) < 42) {
          row.collected = true;
          state.collected++;
        }
      }
    }
    state.progress = state.collected;
    if (state.distance >= state.finish) {
      if (state.collected >= 12) state.phase = 'won';
      else fail('A saída exige 12 sinais. Pegue os olhos nas faixas livres.');
    }
  }

  return { state, update(dt, input) {
    if (state.phase !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
    primaryQueued ||= input.primary || (input.y < -.5 && !upHeld);
    secondaryQueued ||= input.secondary;
    clickQueued ||= input.click;
    upHeld = input.y < -.5;
    accumulator += Math.min(dt, .1);
    while (accumulator >= 1 / 120 && state.phase === 'playing') {
      const step = 1 / 120;
      state.age += step;
      if (state.kind === 'drive') driveStep(step, input, clickQueued);
      else sideStep(step, input, primaryQueued || clickQueued, secondaryQueued);
      primaryQueued = false; secondaryQueued = false; clickQueued = false;
      accumulator -= step;
    }
  } };
}

function hatch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color = PAPER) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.strokeStyle = color; ctx.lineWidth = 1.3;
  for (let offset = -h; offset < w + h; offset += 12) {
    ctx.beginPath(); ctx.moveTo(x + offset, y + h); ctx.lineTo(x + offset + h, y); ctx.stroke();
  }
  ctx.restore();
}
function inkRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = PAPER) {
  ctx.fillStyle = INK; ctx.fillRect(x + 7, y + 7, w, h);
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(x, y, w, h);
}
function eye(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, active = true) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = active ? RED : INK; ctx.strokeStyle = active ? INK : PAPER; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-size, 0); ctx.quadraticCurveTo(0, -size, size, 0); ctx.quadraticCurveTo(0, size, -size, 0); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(0, 0, size * .27, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = INK; ctx.fillRect(-2, -size * .22, 4, size * .44); ctx.restore();
}
function figure(ctx: CanvasRenderingContext2D, x: number, y: number, age: number, grounded: boolean, facing: number) {
  const stride = grounded ? Math.sin(age * 17) * 8 : 6;
  ctx.save(); ctx.translate(x, y); ctx.scale(facing, 1);
  ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.lineCap = 'round';
  for (const leg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(leg * 4, -16); ctx.lineTo(leg * (8 + stride), -2); ctx.stroke(); }
  ctx.fillStyle = PAPER; ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-10, -34); ctx.lineTo(9, -34); ctx.lineTo(13, -12); ctx.lineTo(-12, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = RED; ctx.beginPath(); ctx.moveTo(-8, -32); ctx.lineTo(-27, -23); ctx.lineTo(-17, -37); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(0, -42, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.fillRect(0, -45, 8, 4); ctx.beginPath(); ctx.moveTo(-10, -26); ctx.lineTo(-16, -14); ctx.lineTo(-9, -10); ctx.stroke();
  ctx.restore();
}
function backdrop(ctx: CanvasRenderingContext2D, state: ActionState, camera: number, title: string) {
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.strokeStyle = '#c9bfb1'; ctx.lineWidth = 1;
  for (let line = 90; line < 520; line += 34) { ctx.beginPath(); ctx.moveTo(0, line); ctx.lineTo(960, line - 7); ctx.stroke(); }
  const offset = camera * .18 % 150;
  for (let i = -1; i < 8; i++) {
    const x = i * 150 - offset;
    ctx.fillStyle = '#d4cabe'; ctx.fillRect(x, 178 + i % 3 * 23, 105, 270);
    hatch(ctx, x + 56, 185 + i % 3 * 23, 49, 260, '#b5a897');
    ctx.fillStyle = INK; ctx.fillRect(x + 24, 214 + i % 3 * 23, 25, 6);
  }
  ctx.save(); ctx.translate(810 - camera * .05 % 180, 132); ctx.rotate(-.12);
  ctx.fillStyle = RED; ctx.fillRect(-86, -30, 170, 60); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.strokeRect(-86, -30, 170, 60);
  ctx.fillStyle = PAPER; ctx.font = 'bold 21px monospace'; ctx.textAlign = 'center'; ctx.fillText(title, 0, 7); ctx.restore();
  if (state.kind === 'chase') {
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(0, 110); ctx.lineTo(60, 160); ctx.lineTo(12, 240); ctx.lineTo(73, 310); ctx.lineTo(0, 460); ctx.fill();
    eye(ctx, 22, 266, 27);
  }
}
function drawSide(ctx: CanvasRenderingContext2D, state: ActionState, reducedMotion: boolean) {
  const platform = state.kind === 'platform';
  const camera = Math.max(0, Math.min(state.finish - 680, state.player.x - 220));
  backdrop(ctx, state, camera, platform ? 'SEM VOLTA?' : state.kind === 'chase' ? 'CORRA.' : 'NÃO PARE.');
  ctx.save(); ctx.translate(-camera, 0);
  const floors: ActionRect[] = platform ? state.platforms : [];
  if (!platform) {
    let start = 0;
    for (const gap of state.obstacles.filter((o) => o.kind === 'gap')) { floors.push({ x: start, y: FLOOR, w: gap.x - start, h: 110 }); start = gap.x + gap.w; }
    floors.push({ x: start, y: FLOOR, w: state.finish + 400 - start, h: 110 });
  }
  for (const floor of floors) {
    if (floor.x + floor.w < camera || floor.x > camera + 960) continue;
    ctx.fillStyle = INK; ctx.fillRect(floor.x, floor.y, floor.w, 540 - floor.y);
    ctx.fillStyle = RED; ctx.fillRect(floor.x, floor.y, floor.w, 7);
    hatch(ctx, floor.x, floor.y + 17, floor.w, 48, '#645d54');
  }
  for (const o of state.obstacles) {
    if (o.x + o.w < camera - 30 || o.x > camera + 1000) continue;
    if (o.kind === 'gap') {
      ctx.fillStyle = RED; ctx.beginPath(); ctx.moveTo(o.x + 10, 500); ctx.lineTo(o.x + o.w / 2, 468); ctx.lineTo(o.x + o.w - 10, 500); ctx.fill();
      continue;
    }
    inkRect(ctx, o.x, o.y, o.w, o.h, RED); hatch(ctx, o.x + 4, o.y + 7, o.w - 8, o.h - 10, INK);
    for (let i = 0; i < o.w; i += 13) { ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(o.x + i, o.y); ctx.lineTo(o.x + i + 6, o.y - 12); ctx.lineTo(o.x + i + 12, o.y); ctx.fill(); }
  }
  for (const f of state.fragments) if (!f.collected && f.x > camera - 30 && f.x < camera + 1000) {
    const bob = reducedMotion ? 0 : Math.sin(state.age * 3 + f.x) * 3;
    eye(ctx, f.x, f.y + bob, 19);
  }
  const exitY = platform ? state.platforms[8].y : FLOOR;
  inkRect(ctx, state.finish - 8, exitY - 108, 65, 108, state.kind === 'platform' && state.collected < 8 ? '#8c8174' : RED);
  ctx.fillStyle = PAPER; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillText('SAÍDA', state.finish + 24, exitY - 78);
  eye(ctx, state.finish + 24, exitY - 45, 19, false);
  if (state.dashRemaining > 0) { ctx.strokeStyle = RED; ctx.lineWidth = 4; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(state.player.x - 48, state.player.y - 10 - i * 14); ctx.lineTo(state.player.x - 20, state.player.y - 10 - i * 14); ctx.stroke(); } }
  figure(ctx, state.player.x, state.player.y, reducedMotion ? 0 : state.age, state.player.grounded && state.player.vx !== 0, state.player.facing);
  ctx.restore();
  ctx.fillStyle = INK; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'left';
  const remaining = Math.max(0, Math.ceil((state.finish - state.distance) / 100));
  ctx.fillText(`SAÍDA A ${remaining}m`, 25, 103);
  if (state.kind !== 'runner') ctx.fillText(state.dashCooldown > 0 ? `IMPULSO ${state.dashCooldown.toFixed(1)}s` : 'IMPULSO PRONTO', 25, 125);
}
function drawDrive(ctx: CanvasRenderingContext2D, state: ActionState, reducedMotion: boolean) {
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, 960, 540);
  for (let x = 25; x < 960; x += 80) { hatch(ctx, x, 70, 43, 470, '#b2a596'); }
  ctx.fillStyle = INK; ctx.fillRect(242, 72, 476, 468);
  ctx.fillStyle = RED; ctx.fillRect(242, 72, 8, 468); ctx.fillRect(710, 72, 8, 468);
  const stripeOffset = reducedMotion ? 0 : state.distance * .52 % 60;
  ctx.strokeStyle = PAPER; ctx.lineWidth = 3; ctx.setLineDash([26, 34]); ctx.lineDashOffset = -stripeOffset;
  for (const x of [405, 555]) { ctx.beginPath(); ctx.moveTo(x, 75); ctx.lineTo(x, 540); ctx.stroke(); } ctx.setLineDash([]);
  for (const row of state.rows) {
    const y = 425 - (row.distance - state.distance) * .52;
    if (y < 65 || y > 585) continue;
    for (const lane of row.blocked) {
      inkRect(ctx, LANES[lane] - 41, y - 25, 82, 50, RED);
      hatch(ctx, LANES[lane] - 36, y - 20, 72, 40, INK);
      ctx.fillStyle = PAPER; ctx.font = 'bold 29px monospace'; ctx.textAlign = 'center'; ctx.fillText('×', LANES[lane], y + 10);
    }
    if (!row.collected) eye(ctx, LANES[row.safeLane], y, 27);
  }
  const finishY = 425 - (state.finish - state.distance) * .52;
  if (finishY > 65) {
    for (let col = 0; col < 10; col++) for (let row = 0; row < 2; row++) { ctx.fillStyle = (col + row) % 2 ? INK : PAPER; ctx.fillRect(250 + col * 46, finishY + row * 20, 46, 20); }
  }
  const x = state.player.x; const y = state.player.y;
  ctx.fillStyle = INK; ctx.fillRect(x - 35, y - 32, 12, 52); ctx.fillRect(x + 23, y - 32, 12, 52);
  inkRect(ctx, x - 26, y - 41, 52, 82, PAPER);
  ctx.fillStyle = RED; ctx.fillRect(x - 19, y - 29, 38, 25); ctx.fillRect(x - 19, y + 21, 38, 9);
  ctx.fillStyle = INK; ctx.fillRect(x - 17, y + 1, 34, 15);
  ctx.font = 'bold 17px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.fillText('SEM FREIO', 120, 125);
  ctx.fillStyle = RED; ctx.fillText('SÓ SAÍDA', 840, 155); ctx.font = 'bold 13px monospace'; ctx.fillText(`${Math.max(0, Math.ceil((state.finish - state.distance) / 100))}m`, 840, 183);
}

export function createActionEngine(config: ArcadeConfig): ArcadeEngine {
  const simulation = createActionSimulation(config);
  const { state } = simulation;
  return {
    update: simulation.update,
    draw(ctx, _time, reducedMotion) { ctx.save(); if (state.kind === 'drive') drawDrive(ctx, state, reducedMotion); else drawSide(ctx, state, reducedMotion); ctx.restore(); },
    status() {
      const platform = state.kind === 'platform';
      const drive = state.kind === 'drive';
      return {
        phase: state.phase, progress: drive ? Math.min(state.progress, 12) : state.progress,
        total: platform ? state.fragments.length : drive ? 12 : state.obstacles.length,
        label: platform ? 'Fragmentos recuperados' : drive ? 'Sinais na estrada' : 'Barreiras superadas',
        hint: state.phase === 'lost' ? state.message : state.phase === 'won' ? 'Você atravessou. Track recuperada.' :
          platform ? state.collected === 8 ? 'Todos os olhos recuperados. Alcance a porta vermelha.' : state.message.startsWith('Faltam') ? state.message : 'Pule as falhas. Pegue os 8 olhos e alcance a porta. Impulso: Shift.' :
          drive ? 'Entre na faixa do olho. Desvie das duas barricadas.' : 'Pule grades e buracos até a saída. Os olhos são bônus.',
      };
    },
  };
}

// Useful for tests that exercise real input without constructing DOM events.
export const neutralActionInput = (): ArcadeInput => ({ ...NONE });

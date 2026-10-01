import { INK, PAPER, RED, type ArcadeConfig, type ArcadeEngine, type ArcadeInput, type ArcadeStatus } from './types';

type Point = { x: number; y: number };
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export const CITY_MAP = [
  '###############',
  '#S....#....F..#',
  '#.##..#.###...#',
  '#..F..#...#...#',
  '#.###...#.#.#.#',
  '#...#.F.#...#.#',
  '###.#.###.#...#',
  '#F........#..E#',
  '###############',
];
// The map uses the same grid for walls, collision, pickups and the visible drawing.
export const GRID = { size: 50, x: 105, y: 45 };
export const cellCenter = (col: number, row: number): Point => ({ x: GRID.x + col * GRID.size + 25, y: GRID.y + row * GRID.size + 25 });

export function hatch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color = '#3b3233') {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.strokeStyle = color; ctx.lineWidth = 1;
  ctx.beginPath(); for (let i = -h; i < w; i += 9) { ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + h, y); } ctx.stroke(); ctx.restore();
}
export function skull(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color = PAPER) {
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + 4, y + 5, radius + 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color; ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y - 2, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillRect(x - radius * .55, y + radius * .4, radius * 1.1, radius * .6);
  ctx.fillStyle = INK; ctx.fillRect(x - radius * .6, y - 5, radius * .42, 5); ctx.fillRect(x + radius * .18, y - 5, radius * .42, 5);
  ctx.fillRect(x - 2, y + 1, 4, 4); ctx.fillRect(x - 1, y + radius * .55, 2, radius * .5);
}
export function backdrop(ctx: CanvasRenderingContext2D, label: string) {
  ctx.fillStyle = INK; ctx.fillRect(0, 0, 960, 540);
  hatch(ctx, 0, 0, 960, 540, '#181416');
  ctx.strokeStyle = '#534347'; ctx.lineWidth = 2; ctx.strokeRect(20, 20, 920, 500);
  ctx.fillStyle = '#a89395'; ctx.font = '12px monospace'; ctx.fillText(label.toUpperCase(), 35, 39);
}

export function createExploreModel(config: ArcadeConfig) {
  const player = cellCenter(1, 1);
  const fragments: Array<Point & { found: boolean }> = [];
  CITY_MAP.forEach((row, r) => [...row].forEach((tile, c) => { if (tile === 'F') fragments.push({ ...cellCenter(c, r), found: false }); }));
  const exit = cellCenter(13, 7);
  let phase: ArcadeStatus['phase'] = 'playing'; let elapsed = 0; let health = 3; let invulnerable = 0;
  const hazards = config.kind === 'maze' ? [cellCenter(5, 4), cellCenter(9, 5), cellCenter(7, 7)] : [cellCenter(9, 5)];
  function blocked(x: number, y: number) {
    for (const dx of [-11, 11]) for (const dy of [-11, 11]) {
      const c = Math.floor((x + dx - GRID.x) / GRID.size), r = Math.floor((y + dy - GRID.y) / GRID.size);
      if (!CITY_MAP[r]?.[c] || CITY_MAP[r][c] === '#') return true;
    }
    return false;
  }
  return {
    player, fragments, exit, hazards,
    get elapsed() { return elapsed; }, get health() { return health; },
    get danger() { return elapsed % 3.6 > 2.3; },
    update(dt: number, input: ArcadeInput) {
      if (phase !== 'playing') return;
      elapsed += dt; invulnerable = Math.max(0, invulnerable - dt);
      let dx = input.x, dy = input.y;
      // Click/touch moves toward the marker until reached; walls always stop the avatar.
      if (!dx && !dy && input.pointer) {
        const d = distance(player, input.pointer);
        if (d > 5) { dx = (input.pointer.x - player.x) / d; dy = (input.pointer.y - player.y) / d; }
      }
      const magnitude = Math.max(1, Math.hypot(dx, dy)); const speed = 175;
      const x = player.x + dx / magnitude * speed * dt, y = player.y + dy / magnitude * speed * dt;
      if (!blocked(x, player.y)) player.x = x;
      if (!blocked(player.x, y)) player.y = y;
      fragments.forEach(f => { if (distance(f, player) < 23) f.found = true; });
      if (this.danger && !invulnerable && hazards.some(h => distance(h, player) < 27)) {
        health--; invulnerable = 1.4;
        if (health <= 0) phase = 'lost';
      }
      if (phase === 'playing' && fragments.every(f => f.found) && distance(player, exit) < 24) phase = 'won';
    },
    status(): ArcadeStatus {
      const found = fragments.filter(f => f.found).length;
      return { phase, progress: found, total: fragments.length, label: 'ARQUIVOS', hint: health <= 0 ? 'As grades interromperam o sinal.' : `${health} vidas · ${found === fragments.length ? 'Saída aberta: alcance a porta vermelha.' : 'Recolha os papéis brancos. Grades vermelhas ferem; espere apagarem.'}` };
    },
  };
}
export function createExploreEngine(config: ArcadeConfig): ArcadeEngine {
  const model = createExploreModel(config);
  return {
    update: (dt, input) => model.update(dt, input), status: () => model.status(),
    draw(ctx) {
      backdrop(ctx, config.kind === 'maze' ? 'Cidade cinza / mapa de fuga' : 'Aditivo / arquivos do distrito');
      CITY_MAP.forEach((row, r) => [...row].forEach((tile, c) => {
        const x = GRID.x + c * GRID.size, y = GRID.y + r * GRID.size;
        if (tile === '#') { ctx.fillStyle = '#b5aba4'; ctx.fillRect(x, y, 50, 50); hatch(ctx, x, y, 50, 50, '#605453'); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(x, y, 50, 50); }
      }));
      model.hazards.forEach(h => { ctx.fillStyle = model.danger ? RED : '#59303a'; ctx.fillRect(h.x - 23, h.y - 23, 46, 46); hatch(ctx, h.x - 23, h.y - 23, 46, 46, INK); });
      model.fragments.filter(f => !f.found).forEach((f, i) => {
        ctx.fillStyle = PAPER; ctx.fillRect(f.x - 11, f.y - 15, 22, 30); ctx.fillStyle = RED; ctx.fillRect(f.x - 7, f.y - 10, 14, 3); ctx.fillStyle = INK; ctx.font = 'bold 12px monospace'; ctx.fillText(String(i + 1), f.x - 4, f.y + 7);
      });
      ctx.fillStyle = model.status().progress === 4 ? RED : '#66313a'; ctx.fillRect(model.exit.x - 19, model.exit.y - 23, 38, 46);
      ctx.fillStyle = PAPER; ctx.font = 'bold 22px monospace'; ctx.fillText('↗', model.exit.x - 10, model.exit.y + 8);
      skull(ctx, model.player.x, model.player.y, 12);
      ctx.fillStyle = PAPER; ctx.font = '13px monospace'; ctx.fillText('PAPÉIS = ARQUIVOS     PORTA = SAÍDA     LISTRAS = GRADE ELÉTRICA', 105, 520);
    },
  };
}

type Enemy = Point & { hp: number; warning: number };
type Bullet = Point & { vx: number; vy: number; hostile: boolean; life: number };
export function createCombatModel(config: ArcadeConfig) {
  const boss = config.kind === 'boss'; const target = boss ? 28 : config.trackId === 'track-09' ? 12 : 8;
  const player = { x: 480, y: 380 }; const enemies: Enemy[] = [];
  const bullets: Bullet[] = []; let kills = 0, health = 5, elapsed = 0, spawnClock = 0, fireClock = 0, invulnerable = 0, bossClock = 0, spawned = 0;
  let phase: ArcadeStatus['phase'] = 'playing';
  if (boss) enemies.push({ x: 480, y: 130, hp: target, warning: 1.2 });
  function shoot(from: Point, to: Point, hostile: boolean) {
    const d = Math.max(1, distance(from, to)); const speed = hostile ? 140 : 660;
    bullets.push({ ...from, vx: (to.x - from.x) / d * speed, vy: (to.y - from.y) / d * speed, hostile, life: 3 });
  }
  return {
    player, enemies, bullets,
    get health() { return health; }, get elapsed() { return elapsed; },
    update(dt: number, input: ArcadeInput) {
      if (phase !== 'playing') return;
      elapsed += dt; spawnClock -= dt; fireClock -= dt; invulnerable = Math.max(0, invulnerable - dt);
      const len = Math.max(1, Math.hypot(input.x, input.y));
      player.x = Math.max(45, Math.min(915, player.x + input.x / len * dt * 235)); player.y = Math.max(65, Math.min(490, player.y + input.y / len * dt * 235));
      if (!boss && spawnClock <= 0 && spawned < target) {
        const corners = [{ x: 80, y: 85 }, { x: 870, y: 85 }, { x: 870, y: 460 }, { x: 80, y: 460 }];
        const point = corners[spawned % 4]; enemies.push({ ...point, hp: 1, warning: 1 }); spawned++; spawnClock = 1.9;
      }
      const nearest = enemies.filter(e => e.warning <= 0).sort((a, b) => distance(a, player) - distance(b, player))[0];
      if ((input.primary || input.click) && fireClock <= 0 && (input.pointer || nearest)) {
        shoot(player, input.pointer ?? nearest, false); fireClock = .16;
      }
      enemies.forEach(e => {
        e.warning = Math.max(0, e.warning - dt); if (e.warning) return;
        if (boss) { e.x = 480 + Math.sin(elapsed * .7) * 260; bossClock -= dt; if (bossClock <= 0) { shoot(e, player, true); bossClock = .8; } }
        else { const d = Math.max(1, distance(e, player)); const speed = config.trackId === 'track-09' ? 72 : 55; e.x += (player.x - e.x) / d * dt * speed; e.y += (player.y - e.y) / d * dt * speed; }
        if (distance(e, player) < (boss ? 45 : 27) && !invulnerable) { health--; invulnerable = 1.2; }
      });
      for (const b of bullets) {
        b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
        if (b.hostile && distance(b, player) < 19) { b.life = 0; if (!invulnerable) { health--; invulnerable = 1.2; } }
        if (!b.hostile) for (const e of enemies) {
          if (!e.warning && e.hp > 0 && distance(b, e) < (boss ? 38 : 24)) { e.hp--; kills++; b.life = 0; break; }
        }
      }
      for (let i = bullets.length - 1; i >= 0; i--) if (bullets[i].life <= 0 || bullets[i].x < 0 || bullets[i].x > 960 || bullets[i].y < 0 || bullets[i].y > 540) bullets.splice(i, 1);
      for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].hp <= 0) enemies.splice(i, 1);
      if (health <= 0) phase = 'lost'; else if (kills >= target) phase = 'won';
    },
    status(): ArcadeStatus { return { phase, progress: kills, total: target, label: boss ? 'IMPACTOS' : 'SENTINELAS', hint: `${Math.max(0, health)} vidas · ${boss ? 'Desvie dos projéteis vermelhos e quebre o núcleo.' : 'Elimine as sentinelas. Os círculos avisam onde surgirão.'} Toque em Disparar para mirar no inimigo mais próximo.` }; },
  };
}
export function createCombatEngine(config: ArcadeConfig): ArcadeEngine {
  const model = createCombatModel(config);
  return {
    update: (dt, input) => model.update(dt, input), status: () => model.status(),
    draw(ctx) {
      backdrop(ctx, config.subtitle);
      ctx.strokeStyle = '#3f3034'; ctx.lineWidth = 2;
      for (let x = 40; x < 960; x += 80) { ctx.beginPath(); ctx.moveTo(x, 60); ctx.lineTo(x, 500); ctx.stroke(); }
      for (let y = 60; y < 500; y += 80) { ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(920, y); ctx.stroke(); }
      ctx.save(); ctx.globalAlpha = .13; skull(ctx, 480, 260, 135, RED); ctx.restore();
      model.enemies.forEach(e => {
        if (e.warning) { ctx.strokeStyle = RED; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, e.y, 30, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = PAPER; ctx.font = 'bold 24px monospace'; ctx.fillText('!', e.x - 7, e.y + 8); }
        else skull(ctx, e.x, e.y, config.kind === 'boss' ? 37 : 19, RED);
      });
      model.bullets.forEach(b => { ctx.fillStyle = b.hostile ? RED : PAPER; ctx.beginPath(); ctx.arc(b.x, b.y, b.hostile ? 7 : 4, 0, Math.PI * 2); ctx.fill(); });
      skull(ctx, model.player.x, model.player.y, 16);
      for (let i = 0; i < 5; i++) { ctx.fillStyle = i < model.health ? RED : '#49393d'; ctx.fillRect(800 + i * 23, 30, 16, 8); }
    },
  };
}

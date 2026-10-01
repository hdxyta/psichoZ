import { describe, expect, it } from 'vitest';
import { CITY_MAP, GRID, cellCenter, createExploreModel, createCombatModel } from '../../src/game/arcade/world';
import type { ArcadeConfig, ArcadeInput, EngineKind } from '../../src/game/arcade/types';

const idle = (): ArcadeInput => ({ x: 0, y: 0, primary: false, secondary: false, click: false, pointer: null });
const config = (kind: EngineKind, trackId: ArcadeConfig['trackId']): ArcadeConfig => ({ kind, trackId, title: 'Test', subtitle: 'Test', objective: '', instructions: '', duration: 100, seed: 1 });
type Explore = ReturnType<typeof createExploreModel>;
type Combat = ReturnType<typeof createCombatModel>;
type Cell = [number, number];
function cellFor(point: { x: number; y: number }): Cell { return [Math.floor((point.x - GRID.x) / GRID.size), Math.floor((point.y - GRID.y) / GRID.size)]; }
function route(from: Cell, to: Cell) {
  const queue: Cell[][] = [[from]], visited = new Set([from.join(',')]);
  while (queue.length) {
    const path = queue.shift()!, [x, y] = path.at(-1)!;
    if (x === to[0] && y === to[1]) return path.slice(1);
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const next: Cell = [x + dx, y + dy], key = next.join(',');
      if (!CITY_MAP[next[1]]?.[next[0]] || CITY_MAP[next[1]][next[0]] === '#' || visited.has(key)) continue;
      visited.add(key); queue.push([...path, next]);
    }
  }
  throw new Error(`Unreachable map cell: ${to}`);
}
function walk(model: Explore, target: Cell, avoidHazards = true) {
  const path = route(cellFor(model.player), target);
  for (const step of path) {
    const point = cellCenter(...step);
    if (avoidHazards && model.hazards.some((h) => Math.hypot(h.x - point.x, h.y - point.y) < 1)) {
      while (model.elapsed % 3.6 > 1.3 && model.status().phase === 'playing') model.update(1 / 120, idle());
    }
    for (let i = 0; i < 300 && Math.hypot(point.x - model.player.x, point.y - model.player.y) > 2; i++) {
      const dx = point.x - model.player.x, dy = point.y - model.player.y, d = Math.hypot(dx, dy);
      model.update(1 / 120, { ...idle(), x: dx / d, y: dy / d });
      if (model.status().phase !== 'playing') return;
    }
    expect(Math.hypot(point.x - model.player.x, point.y - model.player.y)).toBeLessThan(3);
  }
}
function fight(model: Combat) {
  for (let i = 0; i < 120 * 75 && model.status().phase === 'playing'; i++) {
    const nearest = model.enemies.filter((e) => e.warning <= 0).sort((a, b) => Math.hypot(a.x - model.player.x, a.y - model.player.y) - Math.hypot(b.x - model.player.x, b.y - model.player.y))[0];
    // Follow a rectangle around the perimeter while aiming at actual visible enemies.
    const segment = Math.floor(model.elapsed / 2.2) % 4;
    const movement = [[1, 0], [0, -1], [-1, 0], [0, 1]][segment];
    model.update(1 / 120, { ...idle(), x: movement[0], y: movement[1], primary: true, pointer: nearest ? { x: nearest.x, y: nearest.y } : null });
  }
}

describe('exploration and maze physical navigation', () => {
  it.each([['explore', 'track-02'], ['maze', 'track-13']] as const)('%s permits a complete real route through all fragments and the exit', (kind, id) => {
    const model = createExploreModel(config(kind, id));
    for (const fragment of model.fragments) walk(model, cellFor(fragment));
    walk(model, cellFor(model.exit));
    expect(model.status()).toMatchObject({ phase: 'won', progress: 4, total: 4 });
    expect(model.health).toBe(3);
  });
  it('does not pass through boundary walls or internal concrete', () => {
    const model = createExploreModel(config('explore', 'track-02'));
    for (let i = 0; i < 600; i++) model.update(1 / 120, { ...idle(), x: -1 });
    expect(model.player.x).toBeGreaterThanOrEqual(GRID.x + GRID.size + 11);
    expect(cellFor(model.player)).toEqual([1, 1]);
    for (let i = 0; i < 600; i++) model.update(1 / 120, { ...idle(), y: -1 });
    expect(model.player.y).toBeGreaterThanOrEqual(GRID.y + GRID.size + 11);
    expect(model.status().progress).toBe(0);
    walk(model, [4, 1]);
    for (let i = 0; i < 600; i++) model.update(1 / 120, { ...idle(), y: 1 });
    expect(cellFor(model.player)).toEqual([4, 3]);
    expect(model.player.y).toBeLessThanOrEqual(GRID.y + 4 * GRID.size - 11);
  });
  it('keeps the exit locked until every distinct file is recovered', () => {
    const model = createExploreModel(config('explore', 'track-02'));
    walk(model, cellFor(model.exit));
    expect(model.status().phase).toBe('playing');
    expect(model.status().progress).toBeLessThan(4);
  });
  it('red electrical gates take actual health and eventually cause failure', () => {
    const model = createExploreModel(config('maze', 'track-13'));
    walk(model, cellFor(model.hazards[0]));
    for (let i = 0; i < 120 * 15; i++) model.update(1 / 120, idle());
    expect(model.health).toBe(0);
    expect(model.status().phase).toBe('lost');
  });
  it('allows pointer navigation to a reachable visible marker', () => {
    const model = createExploreModel(config('explore', 'track-02'));
    const target = cellCenter(4, 1);
    for (let i = 0; i < 160; i++) model.update(1 / 120, { ...idle(), pointer: target });
    expect(Math.hypot(model.player.x - target.x, model.player.y - target.y)).toBeLessThan(5);
  });
});

describe('combat real aiming and collisions', () => {
  it.each([['arena', 'track-04', 8], ['arena', 'track-09', 12], ['boss', 'track-12', 28]] as const)('%s %s is winnable through moving, aiming and shooting', (kind, id, target) => {
    const model = createCombatModel(config(kind, id));
    fight(model);
    expect(model.status(), JSON.stringify({ health: model.health, elapsed: model.elapsed, state: model.status() })).toMatchObject({ phase: 'won', progress: target, total: target });
  });
  it.each([['arena', 'track-04'], ['arena', 'track-09'], ['boss', 'track-12']] as const)('%s %s defeats an inactive player and never auto-awards', (kind, id) => {
    const model = createCombatModel(config(kind, id));
    for (let i = 0; i < 120 * 80; i++) model.update(1 / 120, idle());
    expect(model.status()).toMatchObject({ phase: 'lost', progress: 0 });
    expect(model.health).toBeLessThanOrEqual(0);
  });
  it('warns before contact becomes dangerous and clamps movement to the arena', () => {
    const model = createCombatModel(config('arena', 'track-04'));
    model.update(1 / 120, idle());
    expect(model.enemies[0].warning).toBeGreaterThan(.9);
    for (let i = 0; i < 120 * 4; i++) model.update(1 / 120, { ...idle(), x: -1, y: -1 });
    expect(model.player.x).toBeGreaterThanOrEqual(45);
    expect(model.player.y).toBeGreaterThanOrEqual(65);
  });
  it('boss fires limited-lived hostile projectiles and their collision costs health', () => {
    const model = createCombatModel(config('boss', 'track-12'));
    let sawBullet = false, maximumBullets = 0;
    for (let i = 0; i < 120 * 10 && model.status().phase === 'playing'; i++) {
      model.update(1 / 120, idle());
      sawBullet ||= model.bullets.some((b) => b.hostile);
      maximumBullets = Math.max(maximumBullets, model.bullets.length);
      expect(model.bullets.every((b) => b.life > 0 && b.x >= 0 && b.x <= 960 && b.y >= 0 && b.y <= 540)).toBe(true);
    }
    expect(sawBullet).toBe(true);
    expect(model.health).toBeLessThan(5);
    expect(maximumBullets).toBeLessThanOrEqual(5);
  });
  it('mobile auto-aim can win when only movement and Disparar are used', () => {
    const model = createCombatModel(config('arena', 'track-04'));
    for (let i = 0; i < 120 * 60 && model.status().phase === 'playing'; i++) {
      const movement = [[1, 0], [0, -1], [-1, 0], [0, 1]][Math.floor(model.elapsed / 2.2) % 4];
      model.update(1 / 120, { ...idle(), x: movement[0], y: movement[1], primary: true });
    }
    expect(model.status()).toMatchObject({ phase: 'won', progress: 8 });
  });
  it('a completed or failed combat cannot acquire further hits or move', () => {
    const model = createCombatModel(config('boss', 'track-12'));
    fight(model);
    const result = JSON.stringify({ player: model.player, bullets: model.bullets, health: model.health, status: model.status() });
    for (let i = 0; i < 500; i++) model.update(1 / 120, { ...idle(), x: 1, primary: true });
    expect(JSON.stringify({ player: model.player, bullets: model.bullets, health: model.health, status: model.status() })).toBe(result);
  });
});

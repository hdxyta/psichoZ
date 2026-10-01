import { describe, expect, it } from 'vitest';
import { createActionEngine, createActionSimulation, neutralActionInput } from '../../src/game/arcade/action';
import type { ActionSimulation } from '../../src/game/arcade/action';
import type { ArcadeConfig, ArcadeInput, EngineKind } from '../../src/game/arcade/types';

function config(kind: EngineKind): ArcadeConfig {
  return { trackId: 'track-05', title: 'Teste', subtitle: 'Curso', objective: 'Atravesse', instructions: '', duration: 90, seed: 5, kind };
}
function frames(sim: ActionSimulation, count: number, input: ArcadeInput = neutralActionInput()) {
  for (let i = 0; i < count; i++) sim.update(1 / 60, input);
}
function runCourse(sim: ActionSimulation) {
  for (let frame = 0; frame < 60 * 80 && sim.state.phase === 'playing'; frame++) {
    const { state } = sim;
    const next = state.obstacles.find((o) => !o.cleared);
    const distance = next ? next.x - state.player.x : Infinity;
    const jump = !!next && state.player.grounded && distance < (next.kind === 'gap' ? 58 : 96);
    sim.update(1 / 60, { ...neutralActionInput(), primary: jump });
  }
}
function platformRoute(sim: ActionSimulation) {
  for (let frame = 0; frame < 60 * 80 && sim.state.phase === 'playing'; frame++) {
    const { state } = sim;
    const p = state.player;
    const floor = state.platforms.find((f) => p.x >= f.x && p.x <= f.x + f.w && Math.abs(p.y - f.y) < 2);
    const obstacle = state.obstacles.find((o) => o.x + o.w > p.x && o.x - p.x < 78);
    const nearEdge = floor && floor !== state.platforms.at(-1) && floor.x + floor.w - p.x < 42;
    sim.update(1 / 60, { ...neutralActionInput(), x: 1, primary: p.grounded && Boolean(nearEdge || obstacle) });
  }
}

describe('finite action courses', () => {
  it.each(['runner', 'chase'] as const)('%s cannot award a victory with no input', (kind) => {
    const sim = createActionSimulation(config(kind));
    frames(sim, 60 * 80);
    expect(sim.state.phase).toBe('lost');
    expect(sim.state.progress).toBe(0);
    expect(sim.state.player.x).toBeLessThan(sim.state.finish);
  });
  it.each(['runner', 'chase'] as const)('%s can be finished by jumping the real authored obstacles', (kind) => {
    const sim = createActionSimulation(config(kind));
    runCourse(sim);
    expect(sim.state.phase).toBe('won');
    expect(sim.state.progress).toBe(16);
    expect(sim.state.obstacles.every((obstacle) => obstacle.cleared)).toBe(true);
    expect(sim.state.age).toBeGreaterThan(45);
  });
  it('up is an edge-triggered jump and holding it does not make an automatic pogo stick', () => {
    const sim = createActionSimulation(config('platform'));
    frames(sim, 1, { ...neutralActionInput(), y: -1 });
    expect(sim.state.player.vy).toBeLessThan(0);
    frames(sim, 120, { ...neutralActionInput(), y: -1 });
    expect(sim.state.player.grounded).toBe(true);
    expect(sim.state.player.y).toBe(430);
  });
  it('keeps collision outcomes consistent at 30 and 120 updates per second', () => {
    const slow = createActionSimulation(config('runner'));
    const fast = createActionSimulation(config('runner'));
    for (let i = 0; i < 30 * 8; i++) slow.update(1 / 30, neutralActionInput());
    for (let i = 0; i < 120 * 8; i++) fast.update(1 / 120, neutralActionInput());
    expect(slow.state.phase).toBe('lost');
    expect(slow.state.player.x).toBeCloseTo(fast.state.player.x, 8);
    expect(slow.state.age).toBeCloseTo(fast.state.age, 8);
  });
});

describe('Inverso platform rules', () => {
  it('standing still never collects or wins', () => {
    const sim = createActionSimulation(config('platform'));
    frames(sim, 60 * 80);
    expect(sim.state.phase).toBe('playing');
    expect(sim.state.collected).toBe(0);
    expect(sim.state.player.grounded).toBe(true);
  });
  it('walking through a pit is a loss, rather than a fragment award', () => {
    const sim = createActionSimulation(config('platform'));
    frames(sim, 60 * 8, { ...neutralActionInput(), x: 1 });
    expect(sim.state.phase).toBe('lost');
    expect(sim.state.collected).toBe(0);
  });
  it('is completable through physical jumps and eight distinct collectibles', () => {
    const sim = createActionSimulation(config('platform'));
    platformRoute(sim);
    expect(sim.state.phase, JSON.stringify({ player: sim.state.player, message: sim.state.message, collected: sim.state.collected })).toBe('won');
    expect(sim.state.collected).toBe(8);
    expect(sim.state.fragments.filter((fragment) => fragment.collected)).toHaveLength(8);
    expect(sim.state.player.x).toBeGreaterThanOrEqual(sim.state.finish);
  });
  it('ignores repeated dash presses until its finite cooldown expires', () => {
    const sim = createActionSimulation(config('platform'));
    frames(sim, 1, { ...neutralActionInput(), secondary: true });
    expect(sim.state.dashRemaining).toBeGreaterThan(0);
    expect(sim.state.dashCooldown).toBeGreaterThan(1);
    frames(sim, 20, { ...neutralActionInput(), secondary: true });
    expect(sim.state.dashRemaining).toBe(0);
    expect(sim.state.dashCooldown).toBeGreaterThan(.7);
    expect(sim.state.player.x).toBeLessThan(210);
    frames(sim, 60);
    frames(sim, 1, { ...neutralActionInput(), secondary: true });
    expect(sim.state.dashRemaining).toBeGreaterThan(0);
  });
  it('freezes a terminal state, preserving the exact real outcome', () => {
    const sim = createActionSimulation(config('platform'));
    frames(sim, 400, { ...neutralActionInput(), x: 1 });
    const failed = JSON.stringify(sim.state);
    frames(sim, 800, { ...neutralActionInput(), primary: true, secondary: true, x: 1 });
    expect(JSON.stringify(sim.state)).toBe(failed);
  });
});

describe('three-lane road', () => {
  it('collides with a blocked lane if the driver does nothing', () => {
    const sim = createActionSimulation(config('drive'));
    frames(sim, 60 * 80);
    expect(sim.state.phase).toBe('lost');
    expect(sim.state.collected).toBe(0);
  });
  it('lets keyboard steering traverse the complete authored course', () => {
    const sim = createActionSimulation(config('drive'));
    for (let frame = 0; frame < 60 * 80 && sim.state.phase === 'playing'; frame++) {
      const row = sim.state.rows.find((r) => r.distance + 45 > sim.state.distance);
      const x = row ? Math.sign(row.safeLane - sim.state.lane) : 0;
      sim.update(1 / 60, { ...neutralActionInput(), x });
    }
    expect(sim.state.phase).toBe('won');
    expect(sim.state.collected).toBe(16);
    expect(sim.state.age).toBeGreaterThan(45);
  });
  it('lets pointer input traverse the same course without keyboard access', () => {
    const sim = createActionSimulation(config('drive'));
    for (let frame = 0; frame < 60 * 80 && sim.state.phase === 'playing'; frame++) {
      const row = sim.state.rows.find((r) => r.distance + 45 > sim.state.distance);
      sim.update(1 / 60, { ...neutralActionInput(), click: true, pointer: { x: 330 + (row?.safeLane ?? 1) * 150, y: 430 } });
    }
    expect(sim.state.phase).toBe('won');
    expect(sim.state.collected).toBe(16);
  });
  it('reports explicit real progress through the common engine contract', () => {
    const engine = createActionEngine(config('drive'));
    expect(engine.status()).toMatchObject({ phase: 'playing', progress: 0, total: 12 });
    for (let i = 0; i < 60 * 8; i++) engine.update(1 / 60, neutralActionInput());
    expect(engine.status()).toMatchObject({ phase: 'lost', progress: 0 });
  });
});

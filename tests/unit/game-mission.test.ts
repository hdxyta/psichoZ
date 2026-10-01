import { describe, expect, it } from 'vitest';
import { WOODSTOCK_LEVEL } from '../../src/game/level.ts';
import { getMission, getRunSummary } from '../../src/game/mission.ts';
import type { GameInput, GameState, LevelConfig, Vec2 } from '../../src/game/model.ts';
import { createGameState, PLAYER_SPEED, stepGame } from '../../src/game/simulation.ts';

const idle: GameInput = { forward: 0, strafe: 0, turn: 0, look: 0, fire: false, interact: false };
const arena: LevelConfig = {
  id: 'test-mission', trackId: 'track-01', name: 'Mission fixture',
  bounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 },
  spawn: { x: 0, z: 0, yaw: 0 }, exit: { x: 0, z: -15 },
  enemySpawn: { x: 40, z: 40 }, patrol: [], walls: [],
  // Intentionally shuffled metadata order; mission suggestion is eye / hand / chain.
  symbols: [
    { id: 'chain', kind: 'chain', x: 6, z: -1 },
    { id: 'eye', kind: 'eye', x: -6, z: -1 },
    { id: 'hand', kind: 'hand', x: 0, z: -7 },
  ],
};

function walkTo(state: GameState, target: Vec2, level: LevelConfig): void {
  for (let frame = 0; frame < 1000; frame += 1) {
    const distance = Math.hypot(target.x - state.player.x, target.z - state.player.z);
    if (distance < 0.01) return;
    const yaw = Math.atan2(-(target.x - state.player.x), -(target.z - state.player.z));
    stepGame(state, { ...idle, forward: 1, turn: yaw - state.player.yaw }, Math.min(1 / 60, distance / PLAYER_SPEED), level);
  }
  throw new Error('Input-driven mission fixture could not reach its target.');
}

describe('mission guidance', () => {
  it('suggests the first unrestored authored checkpoint and ignores unknown or duplicate collected IDs', () => {
    const state = createGameState(arena);
    const initial = getMission(state, arena);
    expect(initial.checkpoints.map((checkpoint) => checkpoint.id)).toEqual(['eye', 'hand', 'chain']);
    expect(initial).toMatchObject({ title: 'Liberte o sinal', phase: 'restore', completed: 0, total: 3, objective: 'Revele o sinal', target: { id: 'eye', kind: 'symbol' } });
    state.collected = ['unknown', 'hand', 'hand'];
    const partial = getMission(state, arena);
    expect(partial.completed).toBe(1);
    expect(partial.target?.id).toBe('eye');
    expect(partial.checkpoints.filter((checkpoint) => checkpoint.restored).map((checkpoint) => checkpoint.id)).toEqual(['hand']);
  });

  it('supports out-of-order collection with real inputs and only finishes at the interacted exit', () => {
    const state = createGameState(arena);
    for (const id of ['chain', 'eye', 'hand']) {
      const target = arena.symbols.find((symbol) => symbol.id === id)!;
      walkTo(state, target, arena);
      expect(state.collected).not.toContain(id);
      const events = stepGame(state, { ...idle, interact: true }, 1 / 60, arena);
      expect(events).toContainEqual({ type: 'symbol-collected', id });
      expect(state.collected).toContain(id);
      expect(getMission(state, arena).completed).toBe(state.collected.length);
      expect(getMission(state, arena).target?.id).toBe(id === 'chain' ? 'eye' : id === 'eye' ? 'hand' : `${arena.id}:exit`);
      expect(state.phase).toBe('playing');
    }
    expect(getMission(state, arena)).toMatchObject({ phase: 'transmit', objective: 'Ative a transmissão', target: { kind: 'exit' } });
    walkTo(state, arena.exit, arena);
    expect(state.phase).toBe('playing');
    expect(getMission(state, arena).target?.inRange).toBe(true);
    const events = stepGame(state, { ...idle, interact: true }, 1 / 60, arena);
    expect(events).toContainEqual({ type: 'won' });
    expect(getMission(state, arena)).toMatchObject({ phase: 'won', completed: 3, target: null });
    expect(stepGame(state, { ...idle, interact: true }, 1 / 60, arena)).toEqual([]);
  });

  it.each([
    [{ x: 0, z: -10 }, 0, 'à frente', 0],
    [{ x: -10, z: 0 }, 0, 'à esquerda', Math.PI / 2],
    [{ x: 10, z: 0 }, 0, 'à direita', -Math.PI / 2],
    [{ x: 0, z: 10 }, 0, 'atrás', Math.PI],
    [{ x: -10, z: 0 }, Math.PI / 2, 'à frente', 0],
  ] as const)('reports direction from the actual camera heading', (position, yaw, direction, bearing) => {
    const level: LevelConfig = { ...arena, spawn: { x: 0, z: 0, yaw }, symbols: [{ ...position, id: 'eye', kind: 'eye' }] };
    const mission = getMission(createGameState(level), level);
    expect(mission.target?.direction).toBe(direction);
    expect(Math.abs(mission.target!.bearing)).toBeCloseTo(Math.abs(bearing), 8);
    expect(mission.target?.distance).toBeCloseTo(10, 8);
  });

  it('does not suggest interacting through a wall and labels straight bearing honestly', () => {
    const level: LevelConfig = {
      ...arena,
      symbols: [{ id: 'eye', kind: 'eye', x: 0, z: -1 }],
      walls: [{ id: 'barrier', kind: 'concrete', x: 0, z: -0.5, width: 5, depth: 0.1, height: 3 }],
    };
    const state = createGameState(level);
    const mission = getMission(state, level);
    expect(mission.target).toMatchObject({ distance: 1, inRange: false, lineOfSight: false });
    expect(mission.hint).toContain('Contorne as paredes');
    expect(stepGame(state, { ...idle, interact: true }, 1 / 60, level)).toEqual([]);
    expect(state.collected).toEqual([]);
  });

  it('stays finite at the target, hides guidance after defeat and never mutates state or level', () => {
    const level: LevelConfig = { ...arena, symbols: [{ id: 'eye', kind: 'eye', ...arena.spawn }] };
    const state = createGameState(level);
    const before = JSON.stringify({ state, level });
    expect(getMission(state, level).target).toMatchObject({ distance: 0, bearing: 0, direction: 'à frente', inRange: true });
    expect(JSON.stringify({ state, level })).toBe(before);
    state.phase = 'lost';
    expect(getMission(state, level)).toMatchObject({ phase: 'lost', target: null });
  });
});

describe('run recognition', () => {
  it.each(['playing', 'lost'] as const)('never awards a completion medal for %s', (phase) => {
    const state = createGameState(WOODSTOCK_LEVEL);
    state.phase = phase;
    expect(getRunSummary(state).medal).toBeNull();
  });

  it.each([
    [75, 6, 180, 'gold'],
    [74, 6, 180, 'silver'],
    [75, 7, 180, 'silver'],
    [75, 6, 180.01, 'silver'],
    [40, 12, 300, 'silver'],
    [39, 12, 300, 'bronze'],
    [40, 13, 300, 'bronze'],
    [40, 12, 300.01, 'bronze'],
    [100, 0, 70, 'gold'],
  ] as const)('uses actual health=%i, shots=%i, time=%f for %s recognition', (health, shots, elapsed, tier) => {
    const state = createGameState(WOODSTOCK_LEVEL);
    state.phase = 'won';
    state.player.health = health;
    state.shots = shots;
    state.elapsed = elapsed;
    const before = structuredClone(state);
    expect(getRunSummary(state)).toMatchObject({ outcome: 'won', health, shots, elapsedSeconds: elapsed, medal: { tier } });
    expect(state).toEqual(before);
  });
});

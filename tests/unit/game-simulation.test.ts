import { describe, expect, it } from 'vitest';
import { WOODSTOCK_LEVEL } from '../../src/game/level.ts';
import type { GameEvent, GameInput, GameState, LevelConfig, Vec2, Wall } from '../../src/game/model.ts';
import { createGameState, ENEMY_STUN_DURATION, getEnemyAwareness, hasLineOfSight, PLAYER_RADIUS, PLAYER_SPEED, stepGame } from '../../src/game/simulation.ts';

const idle: GameInput = { forward: 0, strafe: 0, turn: 0, look: 0, fire: false, interact: false };
const arena: LevelConfig = {
  id: 'test-arena', trackId: 'track-01', name: 'Test fixture',
  bounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 },
  spawn: { x: 0, z: 0, yaw: 0 }, exit: { x: 30, z: -30 },
  enemySpawn: { x: 40, z: 40 }, patrol: [], walls: [], symbols: [],
};
const wall: Wall = { id: 'test-wall', x: 0, z: -2, width: 10, depth: 0.4, height: 3, kind: 'concrete' };

function advance(state: GameState, input: Partial<GameInput>, seconds: number, level: LevelConfig, fps = 60): GameEvent[] {
  const events: GameEvent[] = [];
  let remaining = seconds;
  while (remaining > 1e-8) {
    const dt = Math.min(1 / fps, remaining);
    events.push(...stepGame(state, { ...idle, ...input }, dt, level));
    remaining -= dt;
  }
  return events;
}

describe('independent serializable simulation', () => {
  it('creates fresh state without sharing player/enemy or collected state between runs', () => {
    const first = createGameState(WOODSTOCK_LEVEL);
    const second = createGameState(WOODSTOCK_LEVEL);
    first.player.x = 4;
    first.collected.push('fixture');
    expect(second.player.x).toBe(0);
    expect(second.collected).toEqual([]);
    expect(JSON.parse(JSON.stringify(second))).toEqual(second);
    expect(second).toMatchObject({ phase: 'playing', shots: 0, elapsed: 0, player: { health: 100 }, enemy: { health: 3 } });
  });

  it('keeps movement consistent across 30, 60 and 144 FPS', () => {
    const positions = [30, 60, 144].map((fps) => {
      const state = createGameState(arena);
      advance(state, { forward: 1 }, 2, arena, fps);
      expect(state.elapsed).toBeCloseTo(2, 8);
      expect(state.player.x).toBeCloseTo(0);
      expect(state.player.z).toBeCloseTo(-PLAYER_SPEED * 2, 8);
      return state.player.z;
    });
    expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(1e-8);
  });

  it('normalizes diagonal movement and respects the Three camera yaw convention', () => {
    const diagonal = createGameState(arena);
    advance(diagonal, { forward: 1, strafe: 1 }, 1, arena);
    expect(Math.hypot(diagonal.player.x, diagonal.player.z)).toBeCloseTo(PLAYER_SPEED, 8);
    expect(diagonal.player.x).toBeGreaterThan(0);
    expect(diagonal.player.z).toBeLessThan(0);
    const left = createGameState(arena);
    stepGame(left, { ...idle, turn: Math.PI / 2 }, 1 / 60, arena);
    advance(left, { forward: 1 }, 1, arena);
    expect(left.player.x).toBeCloseTo(-PLAYER_SPEED, 8);
    expect(left.player.z).toBeCloseTo(0, 8);
    expect(left.player.yaw).toBeCloseTo(Math.PI / 2, 8);
  });

  it('applies view deltas once per frame, clamps pitch and ignores invalid deltas', () => {
    const state = createGameState(arena);
    stepGame(state, { ...idle, turn: 0.2, look: 5 }, 0.1, arena);
    expect(state.player.yaw).toBeCloseTo(0.2, 8);
    expect(state.player.pitch).toBe(1.1);
    const snapshot = JSON.stringify(state);
    for (const dt of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) stepGame(state, { ...idle, forward: 1 }, dt, arena);
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it('limits a large resumed delta instead of teleporting or simulating a whole hidden interval', () => {
    const state = createGameState(arena);
    stepGame(state, { ...idle, forward: 1 }, 20, arena);
    expect(state.elapsed).toBeCloseTo(0.1, 8);
    expect(state.player.z).toBeCloseTo(-PLAYER_SPEED * 0.1, 8);
  });
});

describe('collision and visibility', () => {
  it('blocks movement through a thin wall while allowing sliding along it', () => {
    const level = { ...arena, walls: [wall] };
    const state = createGameState(level);
    advance(state, { forward: 1 }, 2, level);
    expect(state.player.z).toBeGreaterThanOrEqual(wall.z + wall.depth / 2 + PLAYER_RADIUS - 1e-8);
    expect(state.player.z).toBeLessThan(-1.35);
    advance(state, { forward: 1, strafe: 1 }, 1, level);
    expect(state.player.x).toBeGreaterThan(2);
    expect(state.player.z).toBeGreaterThanOrEqual(wall.z + wall.depth / 2 + PLAYER_RADIUS - 1e-8);
  });

  it('keeps the player inside bounds even when the map has no boundary meshes', () => {
    const level = { ...arena, bounds: { minX: -2, maxX: 2, minZ: -2, maxZ: 2 } };
    const state = createGameState(level);
    advance(state, { forward: 1, strafe: 1 }, 5, level);
    expect(state.player.x).toBeCloseTo(2 - PLAYER_RADIUS, 8);
    expect(state.player.z).toBeCloseTo(-2 + PLAYER_RADIUS, 8);
  });

  it('detects intersecting rays, clear parallel segments and walls behind the target', () => {
    expect(hasLineOfSight({ x: 0, z: 0 }, { x: 0, z: -5 }, [wall])).toBe(false);
    expect(hasLineOfSight({ x: 6, z: 0 }, { x: 6, z: -5 }, [wall])).toBe(true);
    expect(hasLineOfSight({ x: -6, z: 0 }, { x: 6, z: -5 }, [wall])).toBe(false);
    expect(hasLineOfSight({ x: 0, z: 0 }, { x: 0, z: -1 }, [wall])).toBe(true);
  });
});

describe('combat rules', () => {
  it('a hit interrupts movement and melee until the stun expires, then pursuit resumes', () => {
    const level = { ...arena, enemySpawn: { x: 0, z: -1.2 } };
    const state = createGameState(level);
    state.enemy.attackCooldown = 0;
    const enemyStart = { x: state.enemy.x, z: state.enemy.z };
    const hit = stepGame(state, { ...idle, fire: true }, 1 / 60, level);
    expect(hit).toContainEqual({ type: 'shot', hit: 'enemy' });
    expect(state.enemy.stunRemaining).toBeCloseTo(ENEMY_STUN_DURATION - 1 / 60, 8);
    expect(getEnemyAwareness(state, level)).toBe('stunned');
    const stunnedEvents = advance(state, {}, 0.4, level);
    expect(state.enemy.x).toBe(enemyStart.x);
    expect(state.enemy.z).toBe(enemyStart.z);
    expect(state.enemy.attackCooldown).toBe(0);
    expect(state.player.health).toBe(100);
    expect(stunnedEvents.some((event) => event.type === 'player-damaged')).toBe(false);
    const resumedEvents = advance(state, {}, 0.05, level);
    expect(state.enemy.stunRemaining).toBe(0);
    expect(getEnemyAwareness(state, level)).toBe('hunting');
    expect(state.enemy.z).toBeGreaterThan(enemyStart.z);
    expect(resumedEvents).toContainEqual({ type: 'player-damaged', amount: 18 });
  });

  it('stun timing is consistent across frame rates and clamps long resumed deltas', () => {
    const level = { ...arena, enemySpawn: { x: 0, z: -6 } };
    const results = [30, 60, 144].map((fps) => {
      const state = createGameState(level);
      stepGame(state, { ...idle, fire: true }, 1 / 60, level);
      advance(state, {}, 0.7, level, fps);
      expect(state.enemy.stunRemaining).toBe(0);
      return state.enemy.z;
    });
    expect(Math.max(...results) - Math.min(...results)).toBeLessThan(1e-8);
    const resumed = createGameState(level);
    stepGame(resumed, { ...idle, fire: true }, 1 / 60, level);
    stepGame(resumed, idle, 10, level);
    expect(resumed.enemy.stunRemaining).toBeCloseTo(ENEMY_STUN_DURATION - 1 / 60 - 0.1, 8);
    expect(resumed.enemy.z).toBe(level.enemySpawn.z);
  });

  it('awareness derives from live health, line of sight and stun without contradicting combat', () => {
    const level = { ...arena, enemySpawn: { x: 0, z: -6 } };
    const state = createGameState(level);
    expect(getEnemyAwareness(state, level)).toBe('hunting');
    expect(getEnemyAwareness(state, { ...level, walls: [wall] })).toBe('patrolling');
    stepGame(state, { ...idle, fire: true }, 1 / 60, level);
    expect(getEnemyAwareness(state, level)).toBe('stunned');
    advance(state, { fire: true }, 0.9, level);
    expect(state.enemy.health).toBe(0);
    expect(state.enemy.stunRemaining).toBe(0);
    expect(getEnemyAwareness(state, level)).toBe('defeated');
  });

  it('walls block shots against an aligned enemy', () => {
    const level = { ...arena, enemySpawn: { x: 0, z: -6 }, walls: [wall] };
    const state = createGameState(level);
    const events = stepGame(state, { ...idle, fire: true }, 1 / 60, level);
    expect(events).toContainEqual({ type: 'shot', hit: 'wall' });
    expect(state.enemy.health).toBe(3);
    expect(state.enemy.stunRemaining).toBe(0);
    expect(state.shots).toBe(1);
    expect(state.muzzleFlash).toBeGreaterThan(0);
  });

  it('requires horizontal and vertical aim, rather than damaging any nearby enemy', () => {
    const level = { ...arena, enemySpawn: { x: 0, z: -6 } };
    for (const aim of [{ turn: Math.PI / 2, look: 0 }, { turn: 0, look: 1 }]) {
      const state = createGameState(level);
      const events = stepGame(state, { ...idle, ...aim, fire: true }, 1 / 60, level);
      expect(state.enemy.health).toBe(3);
      expect(events).toContainEqual({ type: 'shot', hit: 'none' });
    }
  });

  it('three aimed shots defeat the enemy, with a firing cooldown and one defeat event', () => {
    const level = { ...arena, enemySpawn: { x: 0, z: -6 } };
    const state = createGameState(level);
    const events = advance(state, { fire: true }, 0.9, level);
    expect(state.shots).toBe(3);
    expect(state.enemy.health).toBe(0);
    expect(events.filter((event) => event.type === 'enemy-defeated')).toHaveLength(1);
    expect(state.phase).toBe('playing');
    expect(state.player.health).toBe(100);
  });

  it('blocks enemy melee through a wall despite short distance', () => {
    const barrier = { ...wall, z: -0.65, depth: 0.1 };
    const level = { ...arena, enemySpawn: { x: 0, z: -1.3 }, walls: [barrier] };
    const state = createGameState(level);
    const events = advance(state, {}, 3, level);
    expect(state.player.health).toBe(100);
    expect(events.filter((event) => event.type === 'player-damaged')).toEqual([]);
  });

  it('enemy attacks can cause defeat and terminal states stop simulation', () => {
    const level = { ...arena, enemySpawn: { x: 0, z: -1.3 } };
    const state = createGameState(level);
    const events = advance(state, {}, 8, level);
    expect(state.phase).toBe('lost');
    expect(state.player.health).toBe(0);
    expect(events.filter((event) => event.type === 'lost')).toHaveLength(1);
    const snapshot = JSON.stringify(state);
    expect(stepGame(state, { ...idle, forward: 1, fire: true, interact: true }, 0.1, level)).toEqual([]);
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});

describe('objectives and the authored route', () => {
  it.each([[40, 65, 25], [90, 100, 10], [100, 100, 0]])('restores health once per seal: %i becomes %i', (health, restored, amount) => {
    const level: LevelConfig = { ...arena, symbols: [{ id: 'seal', kind: 'eye', x: 0, z: -1 }] };
    const state = createGameState(level);
    state.player.health = health;
    const events = advance(state, { interact: true }, 1, level);
    expect(state.player.health).toBe(restored);
    expect(events.filter((event) => event.type === 'symbol-collected')).toEqual([{ type: 'symbol-collected', id: 'seal' }]);
    expect(events.filter((event) => event.type === 'player-restored')).toEqual(amount ? [{ type: 'player-restored', amount }] : []);
    // Returning to a restored seal cannot create a health farm.
    state.player.health = 30;
    const repeated = advance(state, { interact: true }, 1, level);
    expect(state.player.health).toBe(30);
    expect(repeated).not.toContainEqual({ type: 'player-restored', amount: 25 });
  });

  it.each(['won', 'lost'] as const)('does not heal, collect or advance stun after terminal state %s', (phase) => {
    const level: LevelConfig = { ...arena, symbols: [{ id: 'seal', kind: 'eye', x: 0, z: -1 }] };
    const state = createGameState(level);
    state.phase = phase;
    state.player.health = 40;
    state.enemy.stunRemaining = 0.4;
    const before = structuredClone(state);
    expect(stepGame(state, { ...idle, interact: true, fire: true }, 0.1, level)).toEqual([]);
    expect(state).toEqual(before);
  });

  it('collects only after interaction, once, and cannot collect through a wall', () => {
    const level: LevelConfig = { ...arena, symbols: [{ id: 'symbol', kind: 'eye', x: 0, z: -1 }] };
    const state = createGameState(level);
    advance(state, {}, 1, level);
    expect(state.collected).toEqual([]);
    const events = advance(state, { interact: true }, 1, level);
    expect(state.collected).toEqual(['symbol']);
    expect(events.filter((event) => event.type === 'symbol-collected')).toHaveLength(1);
    const blocked = { ...level, walls: [{ ...wall, z: -0.5, depth: 0.1 }] };
    const blockedState = createGameState(blocked);
    advance(blockedState, { interact: true }, 1, blocked);
    expect(blockedState.collected).toEqual([]);
  });

  it('reports the actual missing objectives and never wins by merely reaching the exit', () => {
    const level = { ...WOODSTOCK_LEVEL, spawn: { ...WOODSTOCK_LEVEL.exit, yaw: 0 }, enemySpawn: { x: 13, z: 20 }, patrol: [] };
    const state = createGameState(level);
    advance(state, {}, 1, level);
    expect(state.phase).toBe('playing');
    const events = stepGame(state, { ...idle, interact: true }, 1 / 60, level);
    expect(events).toContainEqual({ type: 'exit-locked', remaining: 3 });
    expect(state.phase).toBe('playing');
  });

  it('supports a complete route through both branches, combat, three interactions and the exit using only inputs', () => {
    const level = WOODSTOCK_LEVEL;
    const state = createGameState(level);
    const events: GameEvent[] = [];
    const aimAt = (target: Vec2) => Math.atan2(-(target.x - state.player.x), -(target.z - state.player.z));
    const walkTo = (target: Vec2) => {
      for (let frame = 0; frame < 2500; frame += 1) {
        const remaining = Math.hypot(target.x - state.player.x, target.z - state.player.z);
        if (remaining < 0.08) return;
        // This is an input-driven simulation test, not a public shortcut or a browser playtest.
        const seesEnemy = state.enemy.health > 0 && Math.hypot(state.enemy.x - state.player.x, state.enemy.z - state.player.z) < 11 && hasLineOfSight(state.player, state.enemy, level.walls);
        const targetYaw = aimAt(seesEnemy ? state.enemy : target);
        events.push(...stepGame(state, { ...idle, forward: seesEnemy ? 0 : 1, turn: targetYaw - state.player.yaw, fire: seesEnemy }, Math.min(1 / 60, remaining / PLAYER_SPEED), level));
        expect(state.phase).toBe('playing');
      }
      throw new Error(`Route blocked before ${target.x},${target.z}; at ${state.player.x},${state.player.z}`);
    };
    for (const target of [{ x: 0, z: 10 }, { x: -4, z: 10 }, { x: -4, z: 5.5 }, { x: -9, z: 4 }]) walkTo(target);
    events.push(...stepGame(state, { ...idle, interact: true }, 1 / 60, level));
    for (const target of [{ x: -4, z: 5.5 }, { x: -4, z: 10 }, { x: 4, z: 10 }, { x: 4, z: -3 }, { x: 9, z: -3 }]) walkTo(target);
    events.push(...stepGame(state, { ...idle, interact: true }, 1 / 60, level));
    for (const target of [{ x: 4, z: -3 }, { x: 4, z: -10.8 }, { x: 8, z: -10.8 }, { x: 8, z: -14 }, { x: -8, z: -15 }]) walkTo(target);
    events.push(...stepGame(state, { ...idle, interact: true }, 1 / 60, level));
    expect(state.collected).toEqual(level.symbols.map((symbol) => symbol.id));
    expect(state.phase).toBe('playing');
    for (const target of [{ x: -4, z: -15 }, { x: -4, z: -21 }, level.exit]) walkTo(target);
    events.push(...stepGame(state, { ...idle, interact: true }, 1 / 60, level));
    expect(state.phase).toBe('won');
    expect(events.filter((event) => event.type === 'won')).toHaveLength(1);
    expect(events.filter((event) => event.type === 'symbol-collected')).toHaveLength(3);
    expect(events.some((event) => event.type === 'enemy-defeated')).toBe(true);
    const snapshot = JSON.stringify(state);
    expect(stepGame(state, { ...idle, interact: true }, 0.1, level)).toEqual([]);
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});

import type { GameEvent, GameInput, GameState, LevelConfig, Vec2, Wall } from './model.ts';

export const PLAYER_RADIUS = 0.38;
export const PLAYER_SPEED = 3.6;
export const EYE_HEIGHT = 1.65;
export const INTERACTION_RANGE = 2.2;
export const ENEMY_RADIUS = 0.5;
export const SYMBOL_RESTORATION = 25;
export const ENEMY_STUN_DURATION = 0.45;
const ENEMY_SPEED = 1.7;
const ENEMY_SIGHT = 13;
const ATTACK_RANGE = 1.35;
const ATTACK_DAMAGE = 18;
const ATTACK_INTERVAL = 0.9;
const FIRE_INTERVAL = 0.38;
const SHOT_RANGE = 32;
const MAX_DELTA = 0.1;
const MAX_STEP = 1 / 60;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const finite = (value: number): number => Number.isFinite(value) ? value : 0;
const distance = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.z - b.z);

export function createGameState(level: LevelConfig): GameState {
  return {
    levelId: level.id,
    phase: 'playing',
    player: { ...level.spawn, pitch: 0, health: 100 },
    enemy: { ...level.enemySpawn, health: 3, attackCooldown: 0.5, patrolIndex: 0, stunRemaining: 0 },
    collected: [], elapsed: 0, shots: 0, fireCooldown: 0, interactionCooldown: 0,
    muzzleFlash: 0, damageFlash: 0,
  };
}

/** Distance to the first rectangle touched by a normalized X/Z ray. */
function rayWallDistance(origin: Vec2, direction: Vec2, wall: Wall, maxDistance: number): number | null {
  let near = 0;
  let far = maxDistance;
  for (const [position, delta, lower, upper] of [
    [origin.x, direction.x, wall.x - wall.width / 2, wall.x + wall.width / 2],
    [origin.z, direction.z, wall.z - wall.depth / 2, wall.z + wall.depth / 2],
  ]) {
    if (Math.abs(delta) < 1e-9) {
      if (position < lower || position > upper) return null;
      continue;
    }
    const first = (lower - position) / delta;
    const second = (upper - position) / delta;
    near = Math.max(near, Math.min(first, second));
    far = Math.min(far, Math.max(first, second));
    if (near > far) return null;
  }
  return near <= maxDistance && far >= 0 ? near : null;
}

export function hasLineOfSight(from: Vec2, to: Vec2, walls: readonly Wall[]): boolean {
  const length = distance(from, to);
  if (length < 1e-8) return true;
  const direction = { x: (to.x - from.x) / length, z: (to.z - from.z) / length };
  return !walls.some((wall) => rayWallDistance(from, direction, wall, length) !== null);
}

export type EnemyAwareness = 'patrolling' | 'hunting' | 'stunned' | 'defeated';

/** Derived presentation state; perception and combat keep one source of truth. */
export function getEnemyAwareness(state: Readonly<GameState>, level: LevelConfig): EnemyAwareness {
  if (state.enemy.health <= 0) return 'defeated';
  if (state.enemy.stunRemaining > 0) return 'stunned';
  return distance(state.enemy, state.player) < ENEMY_SIGHT && hasLineOfSight(state.enemy, state.player, level.walls)
    ? 'hunting' : 'patrolling';
}

function canOccupy(point: Vec2, radius: number, level: LevelConfig): boolean {
  const { minX, maxX, minZ, maxZ } = level.bounds;
  if (point.x < minX + radius || point.x > maxX - radius || point.z < minZ + radius || point.z > maxZ - radius) return false;
  return !level.walls.some((wall) => {
    const x = clamp(point.x, wall.x - wall.width / 2, wall.x + wall.width / 2);
    const z = clamp(point.z, wall.z - wall.depth / 2, wall.z + wall.depth / 2);
    return (point.x - x) ** 2 + (point.z - z) ** 2 < radius ** 2;
  });
}

/** Separate axes permit sliding; fixed small steps prevent crossing thin walls. */
function move(entity: Vec2, dx: number, dz: number, radius: number, level: LevelConfig): void {
  const nextX = clamp(entity.x + dx, level.bounds.minX + radius, level.bounds.maxX - radius);
  if (canOccupy({ x: nextX, z: entity.z }, radius, level)) entity.x = nextX;
  const nextZ = clamp(entity.z + dz, level.bounds.minZ + radius, level.bounds.maxZ - radius);
  if (canOccupy({ x: entity.x, z: nextZ }, radius, level)) entity.z = nextZ;
}

function shoot(state: GameState, level: LevelConfig, events: GameEvent[]): void {
  state.fireCooldown = FIRE_INTERVAL;
  state.muzzleFlash = 0.11;
  state.shots += 1;
  const direction = { x: -Math.sin(state.player.yaw), z: -Math.cos(state.player.yaw) };
  let wallDistance = SHOT_RANGE;
  let hitWall = false;
  for (const wall of level.walls) {
    const hit = rayWallDistance(state.player, direction, wall, SHOT_RANGE);
    if (hit !== null && hit <= wallDistance) { wallDistance = hit; hitWall = true; }
  }
  const offset = { x: state.enemy.x - state.player.x, z: state.enemy.z - state.player.z };
  const projection = offset.x * direction.x + offset.z * direction.z;
  const perpendicular = Math.abs(offset.x * direction.z - offset.z * direction.x);
  const rayHeight = EYE_HEIGHT + Math.tan(state.player.pitch) * projection;
  const enemyDistance = projection - Math.sqrt(Math.max(0, ENEMY_RADIUS ** 2 - perpendicular ** 2));
  const enemyHit = state.enemy.health > 0 && projection > 0 && perpendicular <= ENEMY_RADIUS
    && enemyDistance < wallDistance && rayHeight >= 0.15 && rayHeight <= 2.25;
  if (enemyHit) {
    state.enemy.health -= 1;
    state.enemy.stunRemaining = state.enemy.health > 0 ? ENEMY_STUN_DURATION : 0;
    events.push({ type: 'shot', hit: 'enemy' });
    if (state.enemy.health === 0) events.push({ type: 'enemy-defeated' });
  } else events.push({ type: 'shot', hit: hitWall ? 'wall' : 'none' });
}

function updateEnemy(state: GameState, level: LevelConfig, dt: number, events: GameEvent[]): void {
  if (state.enemy.health <= 0) return;
  if (state.enemy.stunRemaining > 0) {
    const stunnedTime = Math.min(dt, state.enemy.stunRemaining);
    state.enemy.stunRemaining = Math.max(0, state.enemy.stunRemaining - stunnedTime);
    dt -= stunnedTime;
    if (dt <= 1e-10) return;
  }
  state.enemy.attackCooldown = Math.max(0, state.enemy.attackCooldown - dt);
  const canSeePlayer = getEnemyAwareness(state, level) === 'hunting';
  const patrolTarget = level.patrol[state.enemy.patrolIndex % Math.max(1, level.patrol.length)] ?? level.enemySpawn;
  const target = canSeePlayer ? state.player : patrolTarget;
  const targetDistance = distance(state.enemy, target);
  if (targetDistance > (canSeePlayer ? ATTACK_RANGE * 0.8 : 0.25)) {
    const speed = canSeePlayer ? ENEMY_SPEED : ENEMY_SPEED * 0.45;
    const amount = Math.min(speed * dt, targetDistance);
    move(state.enemy, (target.x - state.enemy.x) / targetDistance * amount, (target.z - state.enemy.z) / targetDistance * amount, ENEMY_RADIUS, level);
  } else if (!canSeePlayer && level.patrol.length) {
    state.enemy.patrolIndex = (state.enemy.patrolIndex + 1) % level.patrol.length;
  }
  if (distance(state.enemy, state.player) <= ATTACK_RANGE && state.enemy.attackCooldown <= 0 && hasLineOfSight(state.enemy, state.player, level.walls)) {
    const amount = Math.min(ATTACK_DAMAGE, state.player.health);
    state.player.health -= amount;
    state.damageFlash = 0.25;
    state.enemy.attackCooldown = ATTACK_INTERVAL;
    events.push({ type: 'player-damaged', amount });
    if (state.player.health <= 0) { state.phase = 'lost'; events.push({ type: 'lost' }); }
  }
}

function interact(state: GameState, level: LevelConfig, events: GameEvent[]): void {
  state.interactionCooldown = 0.35;
  const nearby = level.symbols
    .filter((symbol) => !state.collected.includes(symbol.id) && distance(state.player, symbol) <= INTERACTION_RANGE && hasLineOfSight(state.player, symbol, level.walls))
    .sort((a, b) => distance(state.player, a) - distance(state.player, b))[0];
  if (nearby) {
    state.collected.push(nearby.id);
    events.push({ type: 'symbol-collected', id: nearby.id });
    const amount = Math.min(SYMBOL_RESTORATION, Math.max(0, 100 - state.player.health));
    state.player.health += amount;
    if (amount > 0) events.push({ type: 'player-restored', amount });
    return;
  }
  if (distance(state.player, level.exit) > INTERACTION_RANGE || !hasLineOfSight(state.player, level.exit, level.walls)) return;
  const remaining = level.symbols.filter((symbol) => !state.collected.includes(symbol.id)).length;
  if (remaining > 0) events.push({ type: 'exit-locked', remaining });
  else { state.phase = 'won'; events.push({ type: 'won' }); }
}

/** Mutates only the supplied serializable state. The host owns pause, rendering and persistence. */
export function stepGame(state: GameState, input: GameInput, dt: number, level: LevelConfig): GameEvent[] {
  if (state.phase !== 'playing' || !Number.isFinite(dt) || dt <= 0) return [];
  const events: GameEvent[] = [];
  const duration = Math.min(dt, MAX_DELTA);
  const steps = Math.max(1, Math.ceil(duration / MAX_STEP));
  const step = duration / steps;
  state.player.yaw = Math.atan2(Math.sin(state.player.yaw + finite(input.turn)), Math.cos(state.player.yaw + finite(input.turn)));
  state.player.pitch = clamp(state.player.pitch + finite(input.look), -1.1, 1.1);
  const forward = clamp(finite(input.forward), -1, 1);
  const strafe = clamp(finite(input.strafe), -1, 1);
  const inputLength = Math.max(1, Math.hypot(forward, strafe));
  const dx = (-Math.sin(state.player.yaw) * forward + Math.cos(state.player.yaw) * strafe) / inputLength * PLAYER_SPEED;
  const dz = (-Math.cos(state.player.yaw) * forward - Math.sin(state.player.yaw) * strafe) / inputLength * PLAYER_SPEED;
  for (let index = 0; index < steps && state.phase === 'playing'; index += 1) {
    state.elapsed += step;
    state.fireCooldown = Math.max(0, state.fireCooldown - step);
    state.interactionCooldown = Math.max(0, state.interactionCooldown - step);
    state.muzzleFlash = Math.max(0, state.muzzleFlash - step);
    state.damageFlash = Math.max(0, state.damageFlash - step);
    move(state.player, dx * step, dz * step, PLAYER_RADIUS, level);
    if (input.fire && state.fireCooldown <= 0) shoot(state, level, events);
    updateEnemy(state, level, step, events);
    if (state.phase === 'playing' && input.interact && state.interactionCooldown <= 0) interact(state, level, events);
  }
  return events;
}

/** Serializable simulation types. Coordinates use metres, X/Z ground plane, Y up. */
export interface Vec2 { x: number; z: number }

export interface Wall extends Vec2 {
  id: string;
  width: number;
  depth: number;
  height: number;
  kind: 'concrete' | 'bars';
}

export interface LevelSymbol extends Vec2 {
  id: string;
  kind: 'eye' | 'hand' | 'chain';
}

export interface LevelConfig {
  id: string;
  trackId: string;
  name: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  walls: readonly Wall[];
  symbols: readonly LevelSymbol[];
  spawn: Vec2 & { yaw: number };
  exit: Vec2;
  enemySpawn: Vec2;
  patrol: readonly Vec2[];
}

export interface GameInput {
  forward: number;
  strafe: number;
  /** Angular delta in radians for this frame. Positive yaw turns left (-X). */
  turn: number;
  /** Angular delta in radians for this frame. Positive pitch looks up. */
  look: number;
  fire: boolean;
  interact: boolean;
}

export interface GameState {
  levelId: string;
  phase: 'playing' | 'won' | 'lost';
  player: Vec2 & { yaw: number; pitch: number; health: number };
  enemy: Vec2 & { health: number; attackCooldown: number; patrolIndex: number; stunRemaining: number };
  collected: string[];
  elapsed: number;
  shots: number;
  fireCooldown: number;
  interactionCooldown: number;
  muzzleFlash: number;
  damageFlash: number;
}

export type GameEvent =
  | { type: 'shot'; hit: 'enemy' | 'wall' | 'none' }
  | { type: 'symbol-collected'; id: string }
  | { type: 'exit-locked'; remaining: number }
  | { type: 'player-damaged'; amount: number }
  | { type: 'player-restored'; amount: number }
  | { type: 'enemy-defeated' }
  | { type: 'won' }
  | { type: 'lost' };

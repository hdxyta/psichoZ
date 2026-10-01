import type { LevelConfig } from './model.ts';

/** One authored concrete labyrinth. Remaining tracks have no invented levels. */
export const WOODSTOCK_LEVEL: LevelConfig = {
  id: 'level-01',
  trackId: 'track-01',
  name: 'Woodstock',
  bounds: { minX: -15, maxX: 15, minZ: -24, maxZ: 24 },
  spawn: { x: 0, z: 20, yaw: 0 },
  exit: { x: 0, z: -21 },
  enemySpawn: { x: 8, z: -13 },
  patrol: [{ x: 8, z: -13 }, { x: 11, z: -16 }, { x: 9, z: -20 }],
  symbols: [
    { id: 'woodstock-eye', kind: 'eye', x: -9, z: 4 },
    { id: 'woodstock-hand', kind: 'hand', x: 9, z: -3 },
    { id: 'woodstock-chain', kind: 'chain', x: -8, z: -15 },
  ],
  walls: [
    { id: 'boundary-west', x: -15.5, z: 0, width: 1, depth: 50, height: 3.6, kind: 'concrete' },
    { id: 'boundary-east', x: 15.5, z: 0, width: 1, depth: 50, height: 3.6, kind: 'concrete' },
    { id: 'boundary-south', x: 0, z: 24.5, width: 32, depth: 1, height: 3.6, kind: 'concrete' },
    { id: 'boundary-north', x: 0, z: -24.5, width: 32, depth: 1, height: 3.6, kind: 'concrete' },
    { id: 'entry-west', x: -3.5, z: 17, width: 1, depth: 12, height: 3.3, kind: 'bars' },
    { id: 'entry-east', x: 3.5, z: 17, width: 1, depth: 12, height: 3.3, kind: 'bars' },
    { id: 'central-block', x: 0, z: -1, width: 6, depth: 18, height: 4.2, kind: 'concrete' },
    { id: 'west-entry-baffle', x: -10, z: 7, width: 10, depth: 0.8, height: 3.1, kind: 'concrete' },
    { id: 'west-turn', x: -7, z: -5, width: 10, depth: 0.8, height: 3.1, kind: 'bars' },
    { id: 'east-entry-baffle', x: 9, z: 4, width: 8, depth: 0.8, height: 3.1, kind: 'concrete' },
    { id: 'east-turn', x: 10, z: -7, width: 10, depth: 0.8, height: 3.1, kind: 'bars' },
    { id: 'north-divider', x: 0, z: -12, width: 12, depth: 0.8, height: 3.4, kind: 'concrete' },
    { id: 'west-exit-baffle', x: -10, z: -18, width: 10, depth: 0.8, height: 3.1, kind: 'bars' },
  ],
};

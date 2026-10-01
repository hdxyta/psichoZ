import { describe, expect, it } from 'vitest';
import { createNavigator } from '../../src/game/navigation';
import { WOODSTOCK_LEVEL as level } from '../../src/game/level';
import { hasLineOfSight, PLAYER_RADIUS } from '../../src/game/simulation';

describe('visual signal tracker', () => {
  it('routes every mission leg around concrete and bars with player clearance', () => {
    const navigator = createNavigator(level);
    const stops = [level.spawn, ...level.symbols, level.exit];
    const padded = level.walls.map((wall) => ({ ...wall, width: wall.width + (PLAYER_RADIUS + .04) * 2, depth: wall.depth + (PLAYER_RADIUS + .04) * 2 }));
    for (let index = 1; index < stops.length; index++) {
      const route = navigator.route(stops[index - 1], stops[index]);
      expect(route.length).toBeGreaterThan(2);
      expect(route[0]).toEqual({ x: stops[index - 1].x, z: stops[index - 1].z });
      expect(route.at(-1)).toEqual({ x: stops[index].x, z: stops[index].z });
      for (let step = 1; step < route.length; step++) expect(hasLineOfSight(route[step - 1], route[step], padded)).toBe(true);
    }
  });
  it('does not draw a route through a completely closed partition', () => {
    const closed = { ...level, walls: [...level.walls, { id: 'test-seal', kind: 'concrete' as const, x: 0, z: 10, width: 30, depth: 1, height: 4 }] };
    expect(createNavigator(closed).route(closed.spawn, closed.symbols[0])).toEqual([]);
  });
  it('rejects invalid positions without returning misleading markers', () => {
    expect(createNavigator(level).route({ x: NaN, z: 0 }, level.exit)).toEqual([]);
  });
});

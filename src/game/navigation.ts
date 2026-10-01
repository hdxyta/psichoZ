import type { LevelConfig, Vec2 } from './model';
import { hasLineOfSight, PLAYER_RADIUS } from './simulation';

/** A coarse, conservative walking grid for the optional visual signal tracker. */
export function createNavigator(level: LevelConfig) {
  const size = 1;
  const width = Math.floor((level.bounds.maxX - level.bounds.minX) / size);
  const height = Math.floor((level.bounds.maxZ - level.bounds.minZ) / size);
  const margin = PLAYER_RADIUS + .04;
  const paddedWalls = level.walls.map((wall) => ({ ...wall, width: wall.width + margin * 2, depth: wall.depth + margin * 2 }));
  const points: Vec2[] = Array.from({ length: width * height }, (_, index) => ({
    x: level.bounds.minX + (index % width + .5) * size,
    z: level.bounds.minZ + (Math.floor(index / width) + .5) * size,
  }));
  const open = points.map((point) => !paddedWalls.some((wall) => Math.abs(point.x - wall.x) <= wall.width / 2 && Math.abs(point.z - wall.z) <= wall.depth / 2));
  const adjacent = points.map((point, index) => {
    if (!open[index]) return [];
    const column = index % width;
    return [column > 0 ? index - 1 : -1, column < width - 1 ? index + 1 : -1, index - width, index + width]
      .filter((next) => next >= 0 && next < points.length && open[next] && hasLineOfSight(point, points[next], paddedWalls));
  });
  const squared = (a: Vec2, b: Vec2) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;
  function nearest(point: Vec2) {
    let best = -1; let distance = Infinity;
    for (let index = 0; index < points.length; index++) {
      const d = squared(points[index], point);
      if (open[index] && d < distance && hasLineOfSight(point, points[index], paddedWalls)) { distance = d; best = index; }
    }
    return best;
  }
  return {
    /** Returns only connected walkable points. It never changes the player or progression. */
    route(from: Vec2, to: Vec2): Vec2[] {
      if (![from.x, from.z, to.x, to.z].every(Number.isFinite)) return [];
      const start = nearest(from); const goal = nearest(to);
      if (start < 0 || goal < 0) return [];
      const previous = new Int16Array(points.length).fill(-1);
      const queue = new Int16Array(points.length); let read = 0; let count = 1;
      queue[0] = start; previous[start] = start;
      while (read < count && previous[goal] === -1) {
        const current = queue[read++];
        for (const next of adjacent[current]) {
          if (previous[next] !== -1) continue;
          previous[next] = current; queue[count++] = next;
        }
      }
      if (previous[goal] === -1) return [];
      const route: Vec2[] = [];
      for (let cursor = goal; cursor !== start; cursor = previous[cursor]) route.push(points[cursor]);
      route.push(points[start]); route.reverse();
      // The exact endpoints also have the same conservative line-of-sight check.
      return [{ x: from.x, z: from.z }, ...route.map((point) => ({ ...point })), { x: to.x, z: to.z }];
    },
  };
}

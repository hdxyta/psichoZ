import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { VENDOR_GAMES } from '../../src/data/vendor-games';
import { TRACK_IDS } from '../../src/data/models';

describe('15 imported games',()=>{
  it('keeps one different game per stable track, with explicit objectives and provenance',()=>{
    expect(VENDOR_GAMES.map(game=>game.trackId)).toEqual(TRACK_IDS);
    expect(new Set(VENDOR_GAMES.map(game=>game.slug)).size).toBe(15);
    expect(new Set(VENDOR_GAMES.map(game=>game.genre)).size).toBe(15);
    for(const game of VENDOR_GAMES){
      expect(game.repository).toMatch(/^https:\/\/github\.com\/[\w-]+\/[\w-]+/);
      expect(game.objective.length).toBeGreaterThan(20);
      expect(game.instructions.length).toBeGreaterThan(20);
      const html = readFileSync(`public/games/${game.slug}/index.html`,'utf8');
      expect(html).toContain('../shared.js');
      expect(html).toContain('../theme.css');
      expect(html).not.toMatch(/(?:src|href)=["']https?:\/\//);
    }
  });
  it('preserves original sources and source manifests outside the public build',()=>{
    for(const group of ['action','puzzles','misc']){
      expect(existsSync(`docs/game-sources-${group}.json`)).toBe(true);
      const manifest = JSON.parse(readFileSync(`docs/game-sources-${group}.json`,'utf8'));
      expect(manifest).toBeTruthy();
    }
    expect(existsSync('docs/vendor-games/makzan/canvas-untangle-game/js/untangle.data.js')).toBe(true);
    expect(existsSync('public/games/untangle/NOTICE.txt')).toBe(true);
  });
});

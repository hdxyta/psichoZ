import { describe, expect, it } from 'vitest';
import { rewards, tracks } from '../../src/data/catalog';
import { getAccess } from '../../src/state/access';
import { createProgressStore, initialProgress, PROGRESS_KEY } from '../../src/state/progress';

class MemoryStorage implements Storage {
  values = new Map<string, string>();
  failRead = false;
  failWrite = false;
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) {
    if (this.failRead) throw new Error('Storage blocked');
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failWrite) throw new Error('Quota exceeded');
    this.values.set(key, value);
  }
  removeItem(key: string) {
    if (this.failWrite) throw new Error('Storage blocked');
    this.values.delete(key);
  }
}

describe('progress persistence', () => {
  it('persists NFC across reload without fabricating track rewards or victories', () => {
    const storage = new MemoryStorage();
    const store = createProgressStore(storage);
    store.updateNfc();
    const reloaded = createProgressStore(storage).getSnapshot();
    expect(reloaded.nfcUnlocked).toBe(true);
    expect(reloaded.unlockedTrackIds).toEqual([]);
    expect(reloaded.completedLevelIds).toEqual([]);
    expect(reloaded.collectibles).toEqual([]);
  });

  it('persists motion preference and returns defensive snapshots', () => {
    const storage = new MemoryStorage();
    const store = createProgressStore(storage);
    store.setReducedMotion(true);
    const snapshot = store.getSnapshot();
    snapshot.preferences.reducedMotion = false;
    snapshot.unlockedTrackIds.push('track-01');
    expect(store.getSnapshot().preferences.reducedMotion).toBe(true);
    expect(store.getSnapshot().unlockedTrackIds).toEqual([]);
    expect(createProgressStore(storage).getSnapshot().preferences.reducedMotion).toBe(true);
  });

  it.each(['{broken', 'null', '[]', '{"version":2,"albumId":"other"}', JSON.stringify({ ...initialProgress(), nfcUnlocked: 'yes' })])(
    'uses memory for malformed state and preserves the previous raw record: %s', (raw) => {
      const storage = new MemoryStorage();
      storage.setItem(PROGRESS_KEY, raw);
      const store = createProgressStore(storage);
      expect(store.getStatus()).toMatchObject({ mode: 'memory', reason: 'invalid-data' });
      expect(store.getSnapshot()).toEqual(initialProgress());
      store.updateNfc();
      expect(store.getSnapshot().nfcUnlocked).toBe(true);
      expect(storage.getItem(PROGRESS_KEY)).toBe(raw);
    },
  );

  it('preserves an unknown future version even after local interactions', () => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify({ ...initialProgress(), version: 8, futureProperty: ['keep'] });
    storage.setItem(PROGRESS_KEY, raw);
    const store = createProgressStore(storage);
    store.updateNfc();
    store.setReducedMotion(true);
    expect(store.getStatus()).toMatchObject({ mode: 'memory', reason: 'unsupported-version' });
    expect(storage.getItem(PROGRESS_KEY)).toBe(raw);
  });

  it('migrates compatible v1 numeric and unpadded IDs without conflating NFC with victories', () => {
    const storage = new MemoryStorage();
    storage.setItem(PROGRESS_KEY, JSON.stringify({
      version: 1, albumId: 'psicoz', nfcAccess: true,
      unlockedTracks: [1, 'track-2', 'track-02', 15, 99, 'wrong'],
      completedLevels: [1, 'track-2', 'level-03', 'wrong'],
      collectibles: ['eye', 'eye', 44, '<script>'],
      preferences: { reducedMotion: true },
    }));
    const store = createProgressStore(storage);
    expect(store.getSnapshot()).toEqual({
      ...initialProgress(), nfcUnlocked: true,
      unlockedTrackIds: ['track-01', 'track-02', 'track-15'],
      completedLevelIds: ['level-01', 'level-02', 'level-03'],
      collectibles: ['eye'], preferences: { reducedMotion: true },
    });
    expect(JSON.parse(storage.getItem(PROGRESS_KEY) ?? '{}').version).toBe(2);
    expect(createProgressStore(storage).getSnapshot()).toEqual(store.getSnapshot());
  });

  it('does not infer 15 victories from NFC in a migrated v1 record', () => {
    const storage = new MemoryStorage();
    storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, nfcAccess: true }));
    expect(createProgressStore(storage).getSnapshot()).toMatchObject({ nfcUnlocked: true, completedLevelIds: [], unlockedTrackIds: [] });
  });

  it('rejects a legacy record explicitly associated with another album', () => {
    const storage = new MemoryStorage();
    storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, albumId: 'different', unlockedTracks: [1] }));
    const store = createProgressStore(storage);
    expect(store.getSnapshot().unlockedTrackIds).toEqual([]);
    expect(store.getStatus().reason).toBe('invalid-data');
  });

  it('falls back to memory when storage is absent or inaccessible', () => {
    for (const storage of [null, Object.assign(new MemoryStorage(), { failRead: true })]) {
      const store = createProgressStore(storage);
      expect(store.getStatus()).toMatchObject({ mode: 'memory', reason: 'unavailable' });
      expect(store.updateNfc().nfcUnlocked).toBe(true);
      expect(store.getStatus().message).toBeTruthy();
    }
  });

  it('retains current session progress and reports failed writes', () => {
    const storage = new MemoryStorage();
    const store = createProgressStore(storage);
    storage.failWrite = true;
    store.updateNfc();
    store.setReducedMotion(true);
    expect(store.getSnapshot()).toMatchObject({ nfcUnlocked: true, preferences: { reducedMotion: true } });
    expect(store.getStatus()).toMatchObject({ mode: 'memory', reason: 'write-failed' });
    expect(storage.getItem(PROGRESS_KEY)).toBeNull();
  });

  it('keeps a failed migration in memory without damaging the original record', () => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify({ version: 1, unlockedTracks: [1] });
    storage.setItem(PROGRESS_KEY, raw);
    storage.failWrite = true;
    const store = createProgressStore(storage);
    expect(store.getSnapshot().unlockedTrackIds).toEqual(['track-01']);
    expect(store.getStatus().reason).toBe('write-failed');
    expect(storage.getItem(PROGRESS_KEY)).toBe(raw);
  });

  it('resets only this project key, preserving unrelated localStorage data', () => {
    const storage = new MemoryStorage();
    storage.setItem('another-project:progress', 'keep me');
    const store = createProgressStore(storage);
    store.updateNfc();
    expect(store.reset()).toEqual(initialProgress());
    expect(storage.getItem(PROGRESS_KEY)).toBeNull();
    expect(storage.getItem('another-project:progress')).toBe('keep me');
    expect(createProgressStore(storage).getSnapshot()).toEqual(initialProgress());
  });

  it('can recover persistent mode through an explicit reset of malformed data', () => {
    const storage = new MemoryStorage();
    storage.setItem(PROGRESS_KEY, 'broken');
    const store = createProgressStore(storage);
    store.reset();
    store.updateNfc();
    expect(store.getStatus().mode).toBe('persistent');
    expect(createProgressStore(storage).getSnapshot().nfcUnlocked).toBe(true);
  });

  it('reports a reset storage failure without clearing unrelated data', () => {
    const storage = new MemoryStorage();
    const store = createProgressStore(storage);
    store.updateNfc();
    storage.failWrite = true;
    expect(store.reset()).toEqual(initialProgress());
    expect(store.getStatus().reason).toBe('write-failed');
    expect(JSON.parse(storage.getItem(PROGRESS_KEY) ?? '{}').nfcUnlocked).toBe(true);
  });
});

describe('Woodstock completion rewards', () => {
  const symbols = ['woodstock-eye', 'woodstock-chain', 'woodstock-thorn'];

  it('persists exactly the first track, level and symbols across reload', () => {
    const storage = new MemoryStorage();
    const store = createProgressStore(storage);
    store.setReducedMotion(true);
    const completed = store.completeLevel('level-01', symbols);
    expect(completed).toEqual({
      ...initialProgress(),
      unlockedTrackIds: ['track-01'], completedLevelIds: ['level-01'],
      collectibles: symbols, preferences: { reducedMotion: true },
    });
    expect(store.getStatus()).toMatchObject({ mode: 'persistent', reason: null });
    expect(createProgressStore(storage).getSnapshot()).toEqual(completed);
  });

  it('awards replayed victories only once and protects stored state from the returned snapshot', () => {
    const storage = new MemoryStorage();
    const store = createProgressStore(storage);
    const firstVictory = store.completeLevel('level-01', symbols);
    const replay = store.completeLevel('level-01', [...symbols, symbols[0]!]);
    expect(replay).toEqual(firstVictory);
    replay.unlockedTrackIds.push('track-02');
    replay.completedLevelIds.push('level-02');
    replay.collectibles.push('invented');
    expect(store.getSnapshot()).toEqual(firstVictory);
    expect(createProgressStore(storage).getSnapshot()).toEqual(firstVictory);
  });

  it('does not award or write progress for an unknown level', () => {
    const storage = new MemoryStorage();
    const store = createProgressStore(storage);
    expect(store.completeLevel('level-99', symbols)).toEqual(initialProgress());
    expect(storage.getItem(PROGRESS_KEY)).toBeNull();
    const completed = store.completeLevel('level-01', symbols);
    const raw = storage.getItem(PROGRESS_KEY);
    expect(store.completeLevel('level-99', ['unearned-symbol'])).toEqual(completed);
    expect(storage.getItem(PROGRESS_KEY)).toBe(raw);
  });

  it('retains a victory for the current session when storage is unavailable', () => {
    for (const storage of [null, Object.assign(new MemoryStorage(), { failRead: true })]) {
      const store = createProgressStore(storage);
      const completed = store.completeLevel('level-01', symbols);
      expect(completed).toMatchObject({
        nfcUnlocked: false, unlockedTrackIds: ['track-01'], completedLevelIds: ['level-01'], collectibles: symbols,
      });
      expect(store.getStatus()).toMatchObject({ mode: 'memory', reason: 'unavailable' });
      expect(store.getSnapshot()).toEqual(completed);
      expect(createProgressStore(storage).getSnapshot()).toEqual(initialProgress());
    }
  });

  it.each([
    { raw: '{broken', reason: 'invalid-data' },
    { raw: JSON.stringify({ ...initialProgress(), version: 99, preserve: ['future'] }), reason: 'unsupported-version' },
  ])('keeps a victory in memory without overwriting a $reason record', ({ raw, reason }) => {
    const storage = new MemoryStorage();
    storage.setItem(PROGRESS_KEY, raw);
    const store = createProgressStore(storage);
    store.completeLevel('level-01', symbols);
    expect(store.getSnapshot()).toMatchObject({ unlockedTrackIds: ['track-01'], completedLevelIds: ['level-01'], collectibles: symbols });
    expect(store.getStatus()).toMatchObject({ mode: 'memory', reason });
    expect(storage.getItem(PROGRESS_KEY)).toBe(raw);
  });

  it('preserves the previous stored record when saving a victory fails', () => {
    const storage = new MemoryStorage();
    const store = createProgressStore(storage);
    store.setReducedMotion(true);
    const beforeVictory = store.getSnapshot();
    const raw = storage.getItem(PROGRESS_KEY);
    storage.failWrite = true;
    store.completeLevel('level-01', symbols);
    expect(store.getSnapshot()).toMatchObject({
      unlockedTrackIds: ['track-01'], completedLevelIds: ['level-01'], collectibles: symbols,
      preferences: { reducedMotion: true },
    });
    expect(store.getStatus()).toMatchObject({ mode: 'memory', reason: 'write-failed' });
    expect(storage.getItem(PROGRESS_KEY)).toBe(raw);
    expect(createProgressStore(storage).getSnapshot()).toEqual(beforeVictory);
  });

  it('preserves NFC access while recording only the level actually completed', () => {
    const storage = new MemoryStorage();
    const store = createProgressStore(storage);
    store.updateNfc();
    const completed = store.completeLevel('level-01', symbols);
    expect(completed).toEqual({
      ...initialProgress(), nfcUnlocked: true,
      unlockedTrackIds: ['track-01'], completedLevelIds: ['level-01'], collectibles: symbols,
    });
    expect(store.updateNfc(false)).toEqual({ ...completed, nfcUnlocked: false });
    expect(store.updateNfc()).toEqual(completed);
    expect(createProgressStore(storage).getSnapshot()).toEqual(completed);
  });

  it('unlocks Woodstock without publishing a reward or unlocking another track', () => {
    const store = createProgressStore(new MemoryStorage());
    const completed = store.completeLevel('level-01', symbols);
    const woodstockReward = rewards.find((reward) => reward.trackId === 'track-01');
    expect(woodstockReward).toBeDefined();
    expect(getAccess(woodstockReward!, completed)).toEqual({
      published: false, unlocked: true, canDownload: false, reason: 'unpublished',
    });
    for (const reward of rewards.filter((item) => item.trackId !== 'track-01')) {
      expect(getAccess(reward, completed)).toEqual({ published: false, unlocked: false, canDownload: false, reason: 'unpublished' });
    }
    expect(tracks.every((track) => !track.published)).toBe(true);
    expect(rewards.every((reward) => !reward.published && reward.url === null)).toBe(true);
  });
});

describe('all-track completion persistence', () => {
  it.each(tracks)('awards and reloads only the completed track $id', (track) => {
    const storage = new MemoryStorage();
    const store = createProgressStore(storage);
    store.updateNfc();
    expect(store.getSnapshot().completedLevelIds).toEqual([]);
    const collectibles = [`${track.id}-recovered`];
    const completed = store.completeLevel(track.levelId!, collectibles);
    expect(completed).toEqual({
      ...initialProgress(), nfcUnlocked: true,
      unlockedTrackIds: [track.id], completedLevelIds: [track.levelId], collectibles,
    });
    expect(store.completeLevel(track.levelId!, collectibles)).toEqual(completed);
    expect(createProgressStore(storage).getSnapshot()).toEqual(completed);
    expect(rewards.filter((reward) => reward.trackId === track.id).every((reward) => !getAccess(reward, completed).canDownload)).toBe(true);
  });
});

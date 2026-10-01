import { describe, expect, it } from 'vitest';
import { getAccess } from '../../src/state/access';
import { initialProgress } from '../../src/state/progress';
import { artworks, rewards, tracks, levels } from '../../src/data/catalog';
import { VENDOR_GAMES, getVendorGame } from '../../src/data/vendor-games';
import { TRACK_IDS, type Reward } from '../../src/data/models';
import { album } from '../../src/config/site';

const reward: Reward = {
  id: 'test-mp3', label: 'Test fixture', kind: 'track', format: 'MP3',
  trackId: 'track-01', requiredLevelId: null, published: false,
  url: '/assets/test.mp3', sizeBytes: null,
};

describe('reward access', () => {
  it.each([
    { published: false, nfc: false, earned: false, expected: false },
    { published: false, nfc: true, earned: false, expected: false },
    { published: false, nfc: false, earned: true, expected: false },
    { published: true, nfc: false, earned: false, expected: false },
    { published: true, nfc: true, earned: false, expected: true },
    { published: true, nfc: false, earned: true, expected: true },
  ])('separates publication/access: $published / NFC $nfc / earned $earned', ({ published, nfc, earned, expected }) => {
    const state = { ...initialProgress(), nfcUnlocked: nfc };
    if (earned) state.unlockedTrackIds.push('track-01');
    const result = getAccess({ ...reward, published }, state);
    expect(result.canDownload).toBe(expected);
    expect(result.unlocked).toBe(nfc || earned);
    expect(result.published).toBe(published);
    expect(result.reason).toBe(!published ? 'unpublished' : expected ? 'available' : 'locked');
  });

  it.each([null, '', 'javascript:alert(1)', 'data:audio/mp3;base64,AA', '//external.example/file.mp3'])('never offers a published reward with a missing/unsafe URL: %s', (url) => {
    const state = { ...initialProgress(), nfcUnlocked: true };
    expect(getAccess({ ...reward, url, published: true }, state)).toMatchObject({
      published: false, unlocked: true, canDownload: false, reason: 'unpublished',
    });
  });

  it('does not unlock another track from one earned track', () => {
    const state = initialProgress();
    state.unlockedTrackIds = ['track-02'];
    expect(getAccess({ ...reward, published: true }, state).canDownload).toBe(false);
  });

  it('respects an explicit level requirement without creating gameplay progress', () => {
    const state = initialProgress();
    state.unlockedTrackIds = ['track-01'];
    const levelReward = { ...reward, published: true, requiredLevelId: 'level-01' as const };
    expect(getAccess(levelReward, state).canDownload).toBe(false);
    state.completedLevelIds = ['level-01'];
    expect(getAccess(levelReward, state).canDownload).toBe(true);
  });

  it('requires the full track collection or NFC for album-wide rewards', () => {
    const albumReward: Reward = { ...reward, kind: 'album', format: 'ZIP', trackId: null, published: true };
    const state = initialProgress();
    state.unlockedTrackIds = TRACK_IDS.slice(0, 14);
    expect(getAccess(albumReward, state).canDownload).toBe(false);
    state.unlockedTrackIds.push('track-15');
    expect(getAccess(albumReward, state).canDownload).toBe(true);
    state.unlockedTrackIds = [];
    state.nfcUnlocked = true;
    expect(getAccess(albumReward, state).canDownload).toBe(true);
    expect(state.completedLevelIds).toEqual([]);
  });
});

describe('catalog with one game for each of the 15 tracks', () => {
  it('describes the four real art derivatives without assigning unapproved track mappings', () => {
    expect(artworks.map((artwork) => artwork.path)).toEqual([
      '/assets/cover-dark-1200.webp', '/assets/cover-light-900.webp',
      '/assets/back-light-900.webp', '/assets/back-dark-900.webp',
    ]);
    expect(artworks.every((artwork) => artwork.trackId === null && artwork.alt.length > 0)).toBe(true);
  });

  it('keeps 15 stable tracks, transcribes the 14 back-cover titles and keeps downloads unpublished', () => {
    expect(tracks.map((track) => track.id)).toEqual(TRACK_IDS);
    expect(tracks[0]).toMatchObject({ id: 'track-01', number: 1, title: 'Woodstock', levelId: 'level-01', published: false });
    expect(tracks.slice(1, 14).map((track) => track.title)).toEqual(['Aditivo', 'Silêncio', 'Químico', 'Inverso', 'Conhecida Ilusão', 'Não Me Dizem Nada', 'Sublime', 'PsicoZ', 'Psicose feat Nobre', 'Assumindo o Risco', 'Acapella', 'Cidade Cinza', 'Não Posso Errar']);
    expect(tracks.map((track) => track.levelId)).toEqual([
      'level-01', 'level-02', 'level-03', 'level-04', 'level-05',
      'level-06', 'level-07', 'level-08', 'level-09', 'level-10',
      'level-11', 'level-12', 'level-13', 'level-14', 'level-15',
    ]);
    expect(tracks.every((track) => track.credits === null && !track.published)).toBe(true);
    expect(tracks[14]).toMatchObject({ id: 'track-15', number: 15, title: null, artworkId: null });
    expect(rewards.filter((item) => item.kind === 'track')).toHaveLength(15);
    expect(rewards.every((item) => !item.published && item.url === null)).toBe(true);
    expect(levels).toHaveLength(15);
    expect(new Set(levels.map((level) => level.id)).size).toBe(15);
    expect(levels.map((level) => level.trackId)).toEqual(TRACK_IDS);
    for (const track of tracks) {
      expect(levels.find((level) => level.id === track.levelId)).toEqual({
        id: track.levelId, trackId: track.id, title: track.title, available: true,
      });
    }
  });

  it('maps every track to a distinct adapted game with honest titles and a source', () => {
    expect(VENDOR_GAMES.map((config) => config.trackId)).toEqual(TRACK_IDS);
    expect(new Set(VENDOR_GAMES.map((config) => config.slug)).size).toBe(15);
    expect(new Set(VENDOR_GAMES.map((config) => config.genre)).size).toBe(15);
    expect(getVendorGame('track-01')?.slug).toBe('maze');
    expect(getVendorGame('track-15')?.slug).toBe('2048');
    expect(getVendorGame('track-99')).toBeUndefined();
    expect(getVendorGame('../track-02')).toBeUndefined();
    for (const config of VENDOR_GAMES) {
      const track = tracks.find((candidate) => candidate.id === config.trackId)!;
      expect(getVendorGame(track.id)).toBe(config);
      expect(config.title).toBe(track.title ?? 'FILE_15');
      expect(config.objective.length).toBeGreaterThan(10);
      expect(config.instructions.length).toBeGreaterThan(10);
      expect(config.duration).toBeGreaterThan(0);
      expect(Number.isFinite(config.duration)).toBe(true);
      expect(config.slug).toMatch(/^[a-z0-9]+$/);
      expect(config.repository).toMatch(/^https:\/\/github\.com\/[^/]+\/[^/]+$/);
      expect(config.sourceName.length).toBeGreaterThan(3);
    }
  });

  it('centralizes the planned release date and retains an editorial pre-release status', () => {
    expect(album).toMatchObject({ id: 'psicoz', title: 'psicoZ', artist: 'YTA', releaseDate: '2026-10-31T00:00:00-03:00', releaseStatus: 'pre-release' });
  });
});


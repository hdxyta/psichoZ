import { ALBUM_ID, TRACK_IDS, type LevelId, type Progress, type TrackId } from '../data/models';
import { levels } from '../data/catalog';

export const PROGRESS_KEY = 'psicoz:progress';
export type StorageReason = 'unavailable' | 'invalid-data' | 'unsupported-version' | 'write-failed' | null;
export interface StorageStatus {
  mode: 'persistent' | 'memory';
  reason: StorageReason;
  message: string | null;
}

export interface ProgressStore {
  getSnapshot(): Progress;
  getStatus(): StorageStatus;
  updateNfc(enabled?: boolean): Progress;
  setReducedMotion(enabled: boolean): Progress;
  completeLevel(levelId: LevelId, collectibles: string[]): Progress;
  reset(): Progress;
}

export function initialProgress(): Progress {
  return {
    version: 2, albumId: ALBUM_ID, nfcUnlocked: false,
    unlockedTrackIds: [], completedLevelIds: [], collectibles: [],
    preferences: { reducedMotion: null },
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unique<T>(values: T[]): T[] { return [...new Set(values)]; }

function normalizedTrackId(value: unknown): TrackId | null {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value : '';
  const match = /^(?:track-)?(\d{1,2})$/u.exec(text);
  if (!match) return null;
  const candidate = `track-${match[1].padStart(2, '0')}`;
  return TRACK_IDS.includes(candidate as TrackId) ? candidate as TrackId : null;
}

function validCollectibles(value: unknown): string[] {
  return Array.isArray(value) ? unique(value.filter((item): item is string => typeof item === 'string' && /^[a-z0-9][a-z0-9_-]{0,79}$/u.test(item))) : [];
}

function normalizedLevelId(value: unknown): LevelId | null {
  if (typeof value === 'string' && /^level-[a-z0-9][a-z0-9_-]{0,79}$/u.test(value)) return value as LevelId;
  const track = normalizedTrackId(value);
  return track ? `level-${track.slice(6)}` : null;
}

function copyProgress(value: Progress): Progress {
  return {
    ...value,
    unlockedTrackIds: [...value.unlockedTrackIds],
    completedLevelIds: [...value.completedLevelIds],
    collectibles: [...value.collectibles],
    preferences: { ...value.preferences },
  };
}

function parseProgress(value: unknown): { state: Progress; migrated: boolean } | StorageReason {
  if (!record(value)) return 'invalid-data';
  if (value.version !== 1 && value.version !== 2) return 'unsupported-version';
  if (value.albumId !== ALBUM_ID && !(value.version === 1 && value.albumId === undefined)) return 'invalid-data';
  const migrated = value.version === 1;
  const trackValues = migrated ? (value.unlockedTrackIds ?? value.unlockedTracks ?? []) : value.unlockedTrackIds;
  const levelValues = migrated ? (value.completedLevelIds ?? value.completedLevels ?? []) : value.completedLevelIds;
  const nfcValue = migrated ? (value.nfcUnlocked ?? value.nfcAccess ?? false) : value.nfcUnlocked;
  if (!Array.isArray(trackValues) || !Array.isArray(levelValues) || typeof nfcValue !== 'boolean') return 'invalid-data';
  if (!migrated && (!Array.isArray(value.collectibles) || !record(value.preferences))) return 'invalid-data';
  const reducedMotion = record(value.preferences) ? value.preferences.reducedMotion : null;
  if (reducedMotion !== undefined && reducedMotion !== null && typeof reducedMotion !== 'boolean') return 'invalid-data';
  return {
    state: {
      ...initialProgress(),
      nfcUnlocked: nfcValue,
      unlockedTrackIds: unique(trackValues.map(normalizedTrackId).filter((id): id is TrackId => id !== null)),
      completedLevelIds: unique(levelValues.map(normalizedLevelId).filter((id): id is LevelId => id !== null)),
      collectibles: validCollectibles(value.collectibles),
      preferences: { reducedMotion: typeof reducedMotion === 'boolean' ? reducedMotion : null },
    },
    migrated,
  };
}

const messages: Record<Exclude<StorageReason, null>, string> = {
  unavailable: 'O armazenamento está indisponível. O progresso permanece apenas nesta visita.',
  'invalid-data': 'O progresso salvo não pôde ser lido. Esta visita usa memória; o registro anterior foi preservado. Redefina o progresso para voltar a salvar.',
  'unsupported-version': 'O progresso salvo pertence a outra versão. Esta visita usa memória e preserva o registro anterior.',
  'write-failed': 'Não foi possível salvar o progresso. Ele permanece apenas nesta visita.',
};

export function createProgressStore(storage?: Storage | null): ProgressStore {
  let target: Storage | null = storage ?? null;
  let state = initialProgress();
  let status: StorageStatus = { mode: 'persistent', reason: null, message: null };
  const memory = (reason: Exclude<StorageReason, null>) => {
    status = { mode: 'memory', reason, message: messages[reason] };
  };
  if (storage === undefined) {
    try { target = window.localStorage; } catch { target = null; }
  }
  if (target === null) memory('unavailable');

  function persist(): void {
    if (!target || status.mode === 'memory') return;
    try { target.setItem(PROGRESS_KEY, JSON.stringify(state)); } catch { memory('write-failed'); }
  }

  if (target) {
    try {
      const raw = target.getItem(PROGRESS_KEY);
      if (raw !== null) {
        let parsed: unknown;
        try { parsed = JSON.parse(raw); } catch { memory('invalid-data'); }
        if (status.mode !== 'memory') {
          const result = parseProgress(parsed);
          if (typeof result === 'string' || result === null) memory(result ?? 'invalid-data');
          else {
            state = result.state;
            if (result.migrated) persist();
          }
        }
      }
    } catch { memory('unavailable'); }
  }

  return {
    getSnapshot: () => copyProgress(state),
    getStatus: () => ({ ...status }),
    updateNfc(enabled = true) {
      state = { ...state, nfcUnlocked: enabled };
      persist();
      return copyProgress(state);
    },
    setReducedMotion(enabled) {
      state = { ...state, preferences: { ...state.preferences, reducedMotion: enabled } };
      persist();
      return copyProgress(state);
    },
    completeLevel(levelId, collectibles) {
      // Called by the game only after the simulation reaches its exit with all symbols.
      const level = levels.find((candidate) => candidate.id === levelId && candidate.available);
      if (!level) return copyProgress(state);
      state = {
        ...state,
        unlockedTrackIds: unique([...state.unlockedTrackIds, level.trackId]),
        completedLevelIds: unique([...state.completedLevelIds, level.id]),
        collectibles: unique([...state.collectibles, ...validCollectibles(collectibles)]),
      };
      persist();
      return copyProgress(state);
    },
    reset() {
      state = initialProgress();
      if (target) {
        try {
          target.removeItem(PROGRESS_KEY);
          status = { mode: 'persistent', reason: null, message: null };
        } catch { memory('write-failed'); }
      }
      return copyProgress(state);
    },
  };
}

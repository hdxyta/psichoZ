export const ALBUM_ID = 'psicoz' as const;

export const TRACK_IDS = [
  'track-01', 'track-02', 'track-03', 'track-04', 'track-05',
  'track-06', 'track-07', 'track-08', 'track-09', 'track-10',
  'track-11', 'track-12', 'track-13', 'track-14', 'track-15',
] as const;

export type TrackId = (typeof TRACK_IDS)[number];
export type ReleaseStatus = 'pre-release' | 'released';
export type LevelId = `level-${string}`;

export interface Artist {
  name: string;
  bio: string;
  photoUrl: string | null;
  contactUrl: string | null;
  links: ReadonlyArray<{ label: string; url: string | null }>;
}

export interface Album {
  id: typeof ALBUM_ID;
  title: string;
  artist: string;
  releaseDate: string;
  releaseStatus: ReleaseStatus;
  concept: string;
  tagline: string;
  trailerUrl: string | null;
  trailerPosterUrl: string | null;
}

export interface Track {
  id: TrackId;
  number: number;
  title: string | null;
  credits: string | null;
  durationSeconds: number | null;
  artworkId: string | null;
  levelId: LevelId | null;
  published: boolean;
}

export interface Artwork {
  id: string;
  label: string;
  path: string | null;
  alt: string;
  trackId: TrackId | null;
}

/** Only implemented levels are marked available; publication remains separate. */
export interface Level {
  id: LevelId;
  trackId: TrackId;
  title: string | null;
  available: boolean;
}

export interface Reward {
  id: string;
  label: string;
  kind: 'track' | 'artwork' | 'album';
  format: 'MP3' | 'PNG' | 'ZIP';
  trackId: TrackId | null;
  /** Optional game requirement; NFC never fabricates its completion. */
  requiredLevelId: LevelId | null;
  published: boolean;
  url: string | null;
  sizeBytes: number | null;
}

export interface Progress {
  version: 2;
  albumId: typeof ALBUM_ID;
  nfcUnlocked: boolean;
  unlockedTrackIds: TrackId[];
  completedLevelIds: LevelId[];
  collectibles: string[];
  preferences: { reducedMotion: boolean | null };
}

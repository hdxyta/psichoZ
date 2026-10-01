import { tracks } from '../../src/data/catalog';
import audioManifest from './audio-manifest.json';
import { downloadsLockedUntil } from './downloads';

export interface CDFile { key: string; filename: string; contentType: string }
export interface CDTrackFiles {
  durationSeconds: number | null;
  stream: CDFile | null;
  download: CDFile | null;
  /** Optional JSON array of normalized, real audio peaks, generated offline. */
  peaks: CDFile | null;
}

/** Approved local CD audio; object keys remain private and never become public asset URLs. */
export const cdFiles: Record<string, CDTrackFiles> = Object.fromEntries(
  tracks.map((track) => {
    const audio = (audioManifest as Record<string, CDTrackFiles>)[track.id];
    return [track.id, audio ? { durationSeconds: audio.durationSeconds, stream: audio.stream, download: audio.download, peaks: audio.peaks }
      : { durationSeconds: track.durationSeconds, stream: null, download: null, peaks: null }];
  }),
);
export const cdAlbum: CDFile | null = null;

export function getCDCatalog() {
  const lockedUntil = downloadsLockedUntil();
  return {
    downloadsLockedUntil: lockedUntil,
    tracks: tracks.map((track) => ({
      id: track.id, number: track.number, title: track.title,
      durationSeconds: cdFiles[track.id].durationSeconds,
      streamUrl: cdFiles[track.id].stream ? `/api/cd-stream/${track.id}` : null,
      downloadUrl: !lockedUntil && cdFiles[track.id].download ? `/api/cd-download/${track.id}` : null,
      peaksUrl: cdFiles[track.id].peaks ? `/api/cd-peaks/${track.id}` : null,
    })),
    albumDownloadUrl: !lockedUntil && cdAlbum ? '/api/cd-download/album' : null,
  };
}

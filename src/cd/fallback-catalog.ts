import { album } from '../config/site';
import { tracks } from '../data/catalog';
import type { CollectorCatalog } from './api';

const cdDurations: Record<string, number> = {
  'track-01': 145.036,
  'track-02': 169.412,
  'track-03': 220.804,
  'track-04': 123.745,
  'track-05': 166.154,
  'track-06': 181.622,
  'track-07': 177,
  'track-08': 130.104,
  'track-09': 155.2,
  'track-10': 168.332,
  'track-11': 237.682,
  'track-12': 156.071,
  'track-13': 166.011,
  'track-14': 251.448,
};

export function fallbackCatalog(): CollectorCatalog {
  return {
    downloadsLockedUntil: album.releaseDate,
    albumDownloadUrl: null,
    tracks: tracks.map((track) => {
      const hasAudio = track.id in cdDurations;
      return {
        id: track.id,
        number: track.number,
        title: track.title,
        durationSeconds: cdDurations[track.id] ?? null,
        streamUrl: hasAudio ? `/api/cd-stream/${track.id}` : null,
        downloadUrl: null,
        peaksUrl: hasAudio ? `/api/cd-peaks/${track.id}` : null,
      };
    }),
  };
}

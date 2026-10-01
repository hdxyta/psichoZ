import { album } from '../../src/config/site';

/** The server clock is authoritative. Playback and game progress are independent. */
export function downloadsAreAvailable(now = Date.now()): boolean {
  return now >= Date.parse(album.releaseDate);
}
export function downloadsLockedUntil(now = Date.now()): string | null {
  return downloadsAreAvailable(now) ? null : album.releaseDate;
}

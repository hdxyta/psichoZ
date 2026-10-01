import { ALBUM_ID, type Album, type Artist } from '../data/models.ts';

/** Editorial configuration, never changed by the visitor's clock. */
export const album: Album = {
  id: ALBUM_ID,
  title: 'psicoZ',
  releaseDate: '2026-10-31',
  releaseStatus: 'pre-release',
  concept: null,
};

export const artist: Artist = {
  name: null,
  bio: null,
  photoUrl: null,
  contactUrl: null,
  links: [
    { label: 'Instagram', url: null },
    { label: 'Spotify', url: null },
    { label: 'YouTube', url: null },
  ],
};

export const presaveLinks: ReadonlyArray<{ label: string; url: string | null }> = [
  { label: 'Spotify', url: null },
  { label: 'Apple Music', url: null },
];

/** Approved listening links are independent from campaign pre-save destinations. */
export const listeningLinks: ReadonlyArray<{ label: string; url: string | null }> = [
  { label: 'Spotify', url: null },
  { label: 'Apple Music', url: null },
];

/** Accept explicit web URLs and root-relative local assets, never executable schemes. */
export function safeUrl(value: unknown, allowLocal = false): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const input = value.trim();
  if (/[\u0000-\u0020\u007f\\]/u.test(input)) return null;
  if (allowLocal && input.startsWith('/') && !input.startsWith('//')) return input;
  try {
    const url = new URL(input);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function assetUrl(path: string, base: string = import.meta.env.VITE_ASSET_BASE_URL ?? ''): string {
  const normalizedPath = path.replace(/^\/+/, '');
  // Asset paths are local identifiers, not user-supplied URLs or traversal routes.
  if (!normalizedPath || normalizedPath.includes('..') || /[?#\\\u0000-\u0020]/u.test(normalizedPath) || /^[a-z]+:/iu.test(normalizedPath)) {
    throw new Error('Caminho de asset inválido.');
  }
  const localFallback = `/${normalizedPath}`;
  if (!base.trim()) return localFallback;
  const checkedBase = safeUrl(base, true);
  if (!checkedBase || /[?#]/u.test(checkedBase)) return localFallback;
  return `${checkedBase.replace(/\/+$/, '')}/${normalizedPath}`;
}

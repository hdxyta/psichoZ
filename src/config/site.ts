import { ALBUM_ID, type Album, type Artist } from '../data/models.ts';

/** Editorial configuration, never changed by the visitor's clock. */
export const album: Album = {
  id: ALBUM_ID,
  title: 'psicoZ',
  artist: 'YTA',
  releaseDate: '2026-10-31T00:00:00-03:00',
  releaseStatus: 'pre-release',
  tagline: '15 TRACKS. 15 EXPERIENCES. ONE WORLD.',
  concept: 'psicoZ é um álbum de 15 faixas criado para existir além do streaming. Cada música se conecta a uma experiência jogável, uma imagem e uma parte da coleção. Você pode simplesmente ouvir. Ou pode entrar.',
  trailerUrl: null,
  trailerPosterUrl: null,
};

export const artist: Artist = {
  name: 'YTA',
  bio: 'YTA é o artista por trás de psicoZ. O projeto atravessa música, imagem e experiências digitais, usando cada lançamento como parte de um universo maior. psicoZ leva essa ideia além da faixa: cada música pode ser explorada, jogada e colecionada. HDX funciona hoje como a estrutura criativa em volta desses projetos.',
  photoUrl: null,
  contactUrl: null,
  links: [
    { label: 'Instagram', url: 'https://www.instagram.com/hdx.yta/' },
    { label: 'Spotify', url: 'https://open.spotify.com/intl-pt/artist/2vka7XJAoHam1YYOCU68dv?si=u8fdEqxeR7mV12fWIZHATw' },
  ],
};

export const presaveLinks: ReadonlyArray<{ label: string; url: string | null }> = [
  { label: 'Spotify de YTA', url: 'https://open.spotify.com/intl-pt/artist/2vka7XJAoHam1YYOCU68dv?si=u8fdEqxeR7mV12fWIZHATw' },
];

/** Approved listening links are independent from campaign pre-save destinations. */
export const listeningLinks: ReadonlyArray<{ label: string; url: string | null }> = [
  { label: 'Spotify de YTA', url: 'https://open.spotify.com/intl-pt/artist/2vka7XJAoHam1YYOCU68dv?si=u8fdEqxeR7mV12fWIZHATw' },
];

export const releaseLinks = {
  spotifyAlbum: '',
  appleMusic: '',
  deezer: '',
  youtube: '',
} as const;

export const credits: ReadonlyArray<{ role: string; name: string }> = [];

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

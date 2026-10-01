import { TRACK_IDS, type Artwork, type Level, type Reward, type Track } from './models';

/** Titles transcribed from the supplied back cover. Track 15 remains a reserved position until confirmed. */
const BACK_COVER_TITLES: ReadonlyArray<string | null> = [
  'Woodstock',
  'Aditivo',
  'Silêncio',
  'Químico',
  'Inverso',
  'Conhecida Ilusão',
  'Não Me Dizem Nada',
  'Sublime',
  'PsicoZ',
  'Psicose feat Nobre',
  'Assumindo o Risco',
  'Acapella',
  'Cidade Cinza',
  'Não Posso Errar',
  null,
];
export const tracks: ReadonlyArray<Track> = TRACK_IDS.map((id, index) => ({
  id,
  number: index + 1,
  title: BACK_COVER_TITLES[index] ?? null,
  credits: null,
  durationSeconds: null,
  artworkId: null,
  levelId: `level-${String(index + 1).padStart(2, '0')}`,
  published: false,
}));

/** Real visual derivatives; no track-to-drawing mapping is approved. */
export const artworks: ReadonlyArray<Artwork> = [
  {
    id: 'cover-dark', label: 'Capa — fundo preto', path: '/assets/cover-dark-1200.webp',
    alt: 'Capa original de psicoZ: colagem de desenhos e lettering em vermelho sobre fundo preto.', trackId: null,
  },
  {
    id: 'cover-light', label: 'Capa — fundo claro', path: '/assets/cover-light-900.webp',
    alt: 'Variante clara da capa original de psicoZ, com colagem de desenhos e lettering em vermelho.', trackId: null,
  },
  {
    id: 'back-light', label: 'Contracapa — fundo claro', path: '/assets/back-light-900.webp',
    alt: 'Contracapa original de psicoZ em fundo claro, com 14 posições de faixas ainda sujeitas a revisão.', trackId: null,
  },
  {
    id: 'back-dark', label: 'Contracapa — fundo preto', path: '/assets/back-dark-900.webp',
    alt: 'Contracapa original de psicoZ em fundo preto, com 14 posições de faixas ainda sujeitas a revisão.', trackId: null,
  },
];
export const levels: ReadonlyArray<Level> = tracks.map((track) => ({
  id: track.levelId!, trackId: track.id, title: track.title, available: true,
}));

export const rewards: ReadonlyArray<Reward> = [
  ...tracks.map((track): Reward => ({
    id: `${track.id}-mp3`,
    label: `${track.title ?? `Faixa ${String(track.number).padStart(2, '0')}`} — MP3`,
    kind: 'track',
    format: 'MP3',
    trackId: track.id,
    requiredLevelId: null,
    published: false,
    url: null,
    sizeBytes: null,
  })),
  {
    id: 'album-artwork-png', label: 'Arte do álbum — PNG', kind: 'artwork', format: 'PNG',
    trackId: null, requiredLevelId: null, published: false, url: null, sizeBytes: null,
  },
  {
    id: 'album-package-zip', label: 'Álbum completo — ZIP', kind: 'album', format: 'ZIP',
    trackId: null, requiredLevelId: null, published: false, url: null, sizeBytes: null,
  },
];


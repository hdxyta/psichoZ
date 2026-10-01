import { describe, expect, it } from 'vitest';
import { artist, assetUrl, listeningLinks, presaveLinks, safeUrl } from '../../src/config/site';

describe('configured URLs', () => {
  it('keeps listening and pre-save configuration independent and unapproved artist content pending', () => {
    expect(listeningLinks).not.toBe(presaveLinks);
    expect(listeningLinks.every((link) => link.url === null)).toBe(true);
    expect(presaveLinks.every((link) => link.url === null)).toBe(true);
    expect(artist).toMatchObject({ name: null, bio: null, photoUrl: null, contactUrl: null });
  });

  it('allows explicit HTTPS links and optional root-relative assets', () => {
    expect(safeUrl('https://music.example/presave')).toBe('https://music.example/presave');
    expect(safeUrl('/assets/art.png')).toBeNull();
    expect(safeUrl('/assets/art.png', true)).toBe('/assets/art.png');
  });

  it.each(['javascript:alert(1)', 'data:text/html,test', '//example.com/test', 'https://user:secret@example.com', 'https:\\example.com', 'java\nscript:alert(1)', '#', null])(
    'rejects unsafe or placeholder links: %s', (input) => {
      expect(safeUrl(input, true)).toBeNull();
    },
  );

  it('resolves local, absolute and prefixed asset bases', () => {
    expect(assetUrl('assets/cover.webp', '')).toBe('/assets/cover.webp');
    expect(assetUrl('/assets/cover.webp', 'https://cdn.example/v1/')).toBe('https://cdn.example/v1/assets/cover.webp');
    expect(assetUrl('assets/cover.webp', '/preview/')).toBe('/preview/assets/cover.webp');
  });

  it.each(['javascript:alert(1)', '//evil.example', 'https://cdn.example/?secret=1', 'https://cdn.example/#frag'])('falls back locally for an invalid asset base: %s', (base) => {
    expect(assetUrl('assets/cover.webp', base)).toBe('/assets/cover.webp');
  });

  it.each(['../secret', 'https://example.com/x', 'assets/a?x=1', 'assets\\cover.webp', ''])('rejects invalid asset identifiers: %s', (path) => {
    expect(() => assetUrl(path, '')).toThrow('Caminho de asset inválido');
  });
});

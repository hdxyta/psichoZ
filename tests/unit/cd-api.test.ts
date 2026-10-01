import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleCDRequest, parseRange, type CDEnv } from '../../server/cd/api';
import { COOKIE_NAME, createSession, readSession, SESSION_SECONDS } from '../../server/cd/auth';
import { cdFiles } from '../../server/cd/catalog';
import { album } from '../../src/config/site';

const env: CDEnv = { CD_ACCESS_CODE: 'test-only-code', CD_SESSION_SECRET: 'test-only-secret-with-more-than-thirty-two-characters' };
const origin = 'https://cd.example.test';
let ip = 0;
function request(path: string, method = 'GET', body?: string, headers: Record<string, string> = {}) {
  return new Request(origin + path, { method, body, headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': `test-${ip++}`, ...headers } });
}
async function cookie(now?: number) { return `${COOKIE_NAME}=${await createSession({ subject: 'physical-edition', edition: null }, env, now)}`; }
const originalFiles = { ...cdFiles['track-01'] };
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(Date.parse(album.releaseDate) + 1000); });
afterEach(() => { cdFiles['track-01'] = { ...originalFiles }; vi.useRealTimers(); });

describe('collector session and access boundary', () => {
  it('sets a signed, private 30-day session without returning the code', async () => {
    const response = await handleCDRequest(request('/api/cd-access', 'POST', JSON.stringify({ code: env.CD_ACCESS_CODE })), env);
    expect(response.status).toBe(200);
    const setCookie = response.headers.get('Set-Cookie')!;
    for (const flag of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', `Max-Age=${SESSION_SECONDS}`, COOKIE_NAME]) expect(setCookie).toContain(flag);
    expect(setCookie).not.toContain(env.CD_ACCESS_CODE);
    expect(await response.text()).not.toContain(env.CD_ACCESS_CODE);
    const session = await handleCDRequest(request('/api/cd-session', 'GET', undefined, { Cookie: setCookie.split(';')[0] }), env);
    expect(await session.json()).toEqual({ authenticated: true, edition: null });
    expect(session.headers.get('Cache-Control')).toBe('private, no-store');
  });
  it('rejects incorrect codes, invalid input, cross-origin posts and wrong methods', async () => {
    expect((await handleCDRequest(request('/api/cd-access', 'POST', '{"code":"wrong"}'), env)).status).toBe(401);
    for (const body of ['{}', '{', '{"code":12}', JSON.stringify({ code: 'x'.repeat(2048) })]) expect((await handleCDRequest(request('/api/cd-access', 'POST', body), env)).status).toBe(400);
    expect((await handleCDRequest(request('/api/cd-access', 'POST', '{}', { Origin: 'https://evil.test' }), env)).status).toBe(403);
    expect((await handleCDRequest(request('/api/cd-logout', 'POST', undefined, { Origin: '' }), env)).status).toBe(403);
    expect((await handleCDRequest(request('/api/cd-access'), env)).status).toBe(405);
    expect((await handleCDRequest(request('/api/cd-session', 'POST', '{}'), env)).status).toBe(405);
  });
  it('fails closed without server secrets', async () => {
    for (const config of [{}, { ...env, CD_SESSION_SECRET: 'short' }]) expect((await handleCDRequest(request('/api/cd-session'), config)).status).toBe(503);
  });
  it('rejects forged, expired and rotated sessions', async () => {
    const valid = await cookie();
    expect(await readSession(request('/api/cd-session', 'GET', undefined, { Cookie: valid }), env)).not.toBeNull();
    for (const token of [`${COOKIE_NAME}=garbage`, valid.slice(0, -5) + 'xxxxx', await cookie(Date.now() - (SESSION_SECONDS + 60) * 1000)]) expect(await readSession(request('/api/cd-session', 'GET', undefined, { Cookie: token }), env)).toBeNull();
    expect(await readSession(request('/api/cd-session', 'GET', undefined, { Cookie: valid }), { ...env, CD_SESSION_SECRET: 'rotated-secret-with-more-than-thirty-two-characters' })).toBeNull();
  });
  it('clears only the collector cookie at logout', async () => {
    const response = await handleCDRequest(request('/api/cd-logout', 'POST'), env);
    expect(response.headers.get('Set-Cookie')).toContain(`${COOKIE_NAME}=;`);
    expect(response.headers.get('Set-Cookie')).toContain('Max-Age=0');
  });
  it('limits repeated access attempts', async () => {
    const statuses = [];
    for (let i = 0; i < 11; i++) statuses.push((await handleCDRequest(request('/api/cd-access', 'POST', '{"code":"wrong"}', { 'CF-Connecting-IP': 'rate-test' }), env)).status);
    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(401)); expect(statuses[10]).toBe(429);
  });
  it('keeps the player public while protecting downloads before consulting storage', async () => {
    const head = vi.fn();
    const get = vi.fn();
    const fileEnv = { ...env, CD_BUCKET: { head, get } };
    for (const method of ['GET', 'HEAD']) {
      expect((await handleCDRequest(request('/api/cd-catalog', method), fileEnv)).status).toBe(200);
      for (const path of ['/api/cd-stream/track-01', '/api/cd-peaks/track-01']) expect((await handleCDRequest(request(path, method), fileEnv)).status).toBe(404);
      for (const path of ['/api/cd-download/track-01', '/api/cd-download/album']) expect((await handleCDRequest(request(path, method), fileEnv)).status).toBe(401);
    }
    expect(head).toHaveBeenCalledTimes(4);
    expect(get).not.toHaveBeenCalled();
  });
  it('exposes 14 supplied recordings and a pending 15th slot without disclosing object keys', async () => {
    const response = await handleCDRequest(request('/api/cd-catalog'), env);
    const catalog = await response.json();
    expect(catalog.tracks).toHaveLength(15); expect(catalog.tracks[14].title).toBeNull();
    for (const track of catalog.tracks.slice(0, 14)) {
      expect(track.streamUrl).toBe(`/api/cd-stream/${track.id}`);
      expect(track.peaksUrl).toBe(`/api/cd-peaks/${track.id}`);
      expect(track.downloadUrl).toBe(`/api/cd-download/${track.id}`);
      expect(track.durationSeconds).toBeGreaterThan(0);
      expect(track).not.toHaveProperty('sourceFilename');
      expect(track).not.toHaveProperty('sourceSha256');
      expect(track).not.toHaveProperty('key');
    }
    expect(catalog.tracks[14].streamUrl).toBeNull();
    expect(catalog.tracks[14].durationSeconds).toBeNull();
    expect(catalog.albumDownloadUrl).toBeNull();
  });
});

describe('private file streaming', () => {
  it('blocks downloads until the exact release instant while preserving streams and peaks', async () => {
    const release = Date.parse(album.releaseDate);
    const head = vi.fn(async () => ({ size: 10, httpEtag: '"test"' }));
    const fileEnv = { ...env, CD_BUCKET: { head, get: vi.fn() } };
    vi.setSystemTime(release - 1);
    const headers = { Cookie: await cookie() };
    for (const method of ['GET', 'HEAD']) for (const id of ['track-01', 'album']) {
      const response = await handleCDRequest(request(`/api/cd-download/${id}`, method, undefined, headers), fileEnv);
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: 'release_pending', availableAt: album.releaseDate });
    }
    expect(head).not.toHaveBeenCalled();
    const catalog = await (await handleCDRequest(request('/api/cd-catalog', 'GET', undefined, headers), fileEnv)).json();
    expect(catalog.downloadsLockedUntil).toBe(album.releaseDate);
    expect(catalog.tracks.every((track: { downloadUrl: string | null }) => track.downloadUrl === null)).toBe(true);
    expect(catalog.albumDownloadUrl).toBeNull();
    for (const kind of ['stream', 'peaks']) expect((await handleCDRequest(request(`/api/cd-${kind}/track-01`, 'HEAD', undefined, headers), fileEnv)).status).toBe(200);
    for (const instant of [release, release + 1000]) {
      vi.setSystemTime(instant);
      expect((await handleCDRequest(request('/api/cd-download/track-01', 'HEAD', undefined, headers), fileEnv)).status).toBe(200);
      const unlocked = await (await handleCDRequest(request('/api/cd-catalog', 'GET', undefined, headers), fileEnv)).json();
      expect(unlocked.downloadsLockedUntil).toBeNull();
      expect(unlocked.tracks[0].downloadUrl).toBe('/api/cd-download/track-01');
    }
  });
  it.each([['bytes=2-5', { offset: 2, length: 4 }], ['bytes=7-', { offset: 7, length: 3 }], ['bytes=-3', { offset: 7, length: 3 }], ['bytes=0-999', { offset: 0, length: 10 }], ['bytes=10-', null], ['bytes=-0', null], ['bytes=5-2', null], ['bytes=1-2,4-5', null], ['nonsense', null]])('parses %s safely', (header, expected) => { expect(parseRange(header as string, 10)).toEqual(expected); });
  it('returns exact byte ranges, attachment headers, and HEAD without a body', async () => {
    cdFiles['track-01'].stream = { key: 'private-stream.mp3', filename: '01-Woodstock.mp3', contentType: 'audio/mpeg' };
    cdFiles['track-01'].download = { key: 'private-master.wav', filename: '01-Woodstock.wav', contentType: 'audio/wav' };
    const get = vi.fn(async (_key: string, options?: { range?: { offset: number; length: number } }) => ({ size: 10, httpEtag: '"test"', body: new Response('0123456789'.slice(options?.range?.offset ?? 0, options?.range ? options.range.offset + options.range.length : undefined)).body! }));
    const filesEnv: CDEnv = { ...env, CD_BUCKET: { head: async () => ({ size: 10, httpEtag: '"test"' }), get } };
    const headers = { Cookie: await cookie(), Range: 'bytes=2-5' };
    const response = await handleCDRequest(request('/api/cd-stream/track-01', 'GET', undefined, headers), filesEnv);
    expect(response.status).toBe(206); expect(response.headers.get('Content-Range')).toBe('bytes 2-5/10'); expect(await response.text()).toBe('2345');
    const download = await handleCDRequest(request('/api/cd-download/track-01', 'HEAD', undefined, headers), filesEnv);
    expect(download.headers.get('Content-Disposition')).toBe('attachment; filename="01-Woodstock.wav"'); expect(await download.text()).toBe(''); expect(get).toHaveBeenCalledTimes(1);
    expect((await handleCDRequest(request('/api/cd-stream/track-01', 'GET', undefined, { ...headers, Range: 'bytes=99-' }), filesEnv)).status).toBe(416);
    expect((await handleCDRequest(request('/api/cd-download/track-99', 'GET', undefined, headers), filesEnv)).status).toBe(404);
    expect((await handleCDRequest(request('/api/cd-download/arbitrary-key', 'GET', undefined, headers), filesEnv)).status).toBe(404);
    expect((await handleCDRequest(request('/api/cd-stream/track-01', 'GET', undefined, headers), { ...env, CD_BUCKET: { head: async () => null, get } })).status).toBe(404);
  });
});

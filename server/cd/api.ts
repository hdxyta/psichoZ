import { cdAlbum, cdFiles, getCDCatalog } from './catalog';
import { downloadsAreAvailable, downloadsLockedUntil } from './downloads';
import { createSession, isConfigured, readSession, sessionCookie, validateAccessCode, type AuthEnv } from './auth';

export interface ObjectInfo { size: number; httpEtag: string }
export interface PrivateBucket {
  head(key: string): Promise<ObjectInfo | null>;
  get(key: string, options?: { range?: { offset: number; length: number } }): Promise<(ObjectInfo & { body: ReadableStream<Uint8Array> }) | null>;
}
export interface CDEnv extends AuthEnv { CD_BUCKET?: PrivateBucket }
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cross-Origin-Resource-Policy': 'same-origin' };
function json(value: unknown, status = 200, extra: Record<string, string> = {}) {
  return Response.json(value, { status, headers: { ...headers, ...extra } });
}
const attempts = new Map<string, { count: number; until: number }>();
/** Best effort per isolate; use an edge rate-limit rule for distributed enforcement. */
function allowed(request: Request) {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
  const entry = attempts.get(ip) ?? { count: 0, until: now + 60_000 };
  if (!attempts.has(ip) && attempts.size >= 4096) return false;
  entry.count++;
  attempts.set(ip, entry);
  return entry.count <= 10;
}
export function parseRange(value: string, size: number): { offset: number; length: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/u.exec(value);
  if (!match || (!match[1] && !match[2]) || size <= 0) return null;
  let start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (![start, end].every(Number.isSafeInteger) || start < 0 || start >= size || end < start) return null;
  return { offset: start, length: end - start + 1 };
}
async function boundedCode(request: Request): Promise<string | null> {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  let body = ''; let bytes = 0;
  const decoder = new TextDecoder();
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    bytes += part.value.byteLength;
    if (bytes > 1024) { await reader.cancel(); return null; }
    body += decoder.decode(part.value, { stream: true });
  }
  try {
    const value = JSON.parse(body + decoder.decode());
    return typeof value.code === 'string' && value.code.length > 0 && value.code.length <= 128 ? value.code : null;
  } catch { return null; }
}

export async function handleCDRequest(request: Request, env: CDEnv): Promise<Response> {
  try {
    const url = new URL(request.url);
    const route = url.pathname;
    const mutation = route === '/api/cd-access' || route === '/api/cd-logout';
    if (mutation && request.method !== 'POST') return json({ error: 'method' }, 405, { Allow: 'POST' });
    if (!mutation && !['GET', 'HEAD'].includes(request.method)) return json({ error: 'method' }, 405, { Allow: 'GET, HEAD' });
    if (mutation && (request.headers.get('Origin') !== url.origin || request.headers.get('Sec-Fetch-Site') === 'cross-site')) return json({ error: 'origin' }, 403);
    if (route === '/api/cd-catalog') return json(getCDCatalog());
    if (route === '/api/cd-logout') return json({ authenticated: false }, 200, { 'Set-Cookie': sessionCookie('', 0) });
    if (route === '/api/cd-access') {
      if (!isConfigured(env)) return json({ error: 'unavailable' }, 503);
      if (!allowed(request)) return json({ error: 'rate_limit' }, 429, { 'Retry-After': '60' });
      const code = await boundedCode(request);
      if (!code) return json({ error: 'invalid_request' }, 400);
      const identity = await validateAccessCode(code, env);
      if (!identity) return json({ error: 'invalid_code' }, 401);
      return json({ authenticated: true, edition: identity.edition }, 200, { 'Set-Cookie': sessionCookie(await createSession(identity, env)) });
    }
    if (route === '/api/cd-session') {
      if (!isConfigured(env)) return json({ error: 'unavailable' }, 503);
      const identity = await readSession(request, env);
      return identity ? json({ authenticated: true, edition: identity.edition }) : json({ authenticated: false, error: 'session_expired' }, 401);
    }
    const match = /^\/api\/cd-(stream|download|peaks)\/(track-\d{2}|album)$/u.exec(route);
    if (!match) return json({ error: 'not_found' }, 404);
    const [, kind, id] = match;
    if (kind === 'download') {
      if (!isConfigured(env)) return json({ error: 'unavailable' }, 503);
      const identity = await readSession(request, env);
      if (!identity) return json({ authenticated: false, error: 'session_expired' }, 401);
    }
    if (kind === 'download' && !downloadsAreAvailable()) return json({ error: 'release_pending', availableAt: downloadsLockedUntil() }, 403);
    const file = id === 'album' ? (kind === 'download' ? cdAlbum : null) : cdFiles[id]?.[kind as 'stream' | 'download' | 'peaks'];
    if (!file) return json({ error: 'not_published' }, 404);
    if (!env.CD_BUCKET) return json({ error: 'unavailable' }, 503);
    const info = await env.CD_BUCKET.head(file.key);
    if (!info) return json({ error: 'not_published' }, 404);
    const rangeHeader = request.headers.get('Range');
    const range = rangeHeader ? parseRange(rangeHeader, info.size) : undefined;
    if (range === null) return json({ error: 'range' }, 416, { 'Content-Range': `bytes */${info.size}` });
    const responseHeaders = new Headers({ ...headers, 'Content-Type': file.contentType, 'Accept-Ranges': 'bytes', 'Content-Length': String(range?.length ?? info.size), ETag: info.httpEtag });
    if (range) responseHeaders.set('Content-Range', `bytes ${range.offset}-${range.offset + range.length - 1}/${info.size}`);
    const filename = file.filename.replace(/[^a-zA-Z0-9._-]/gu, '_');
    responseHeaders.set('Content-Disposition', `${kind === 'download' ? 'attachment' : 'inline'}; filename="${filename}"`);
    if (request.method === 'HEAD') return new Response(null, { status: range ? 206 : 200, headers: responseHeaders });
    const object = await env.CD_BUCKET.get(file.key, range ? { range } : undefined);
    if (!object) return json({ error: 'not_published' }, 404);
    return new Response(object.body, { status: range ? 206 : 200, headers: responseHeaders });
  } catch { return json({ error: 'unavailable' }, 503); }
}

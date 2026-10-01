export interface CDIdentity { subject: string; edition: string | null }
export interface AuthEnv { CD_ACCESS_CODE?: string; CD_SESSION_SECRET?: string }
const encoder = new TextEncoder();
export const SESSION_SECONDS = 30 * 24 * 60 * 60;
export const COOKIE_NAME = '__Host-psicoz_cd';

async function digest(value: string) { return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))); }
async function equal(a: string, b: string) {
  const [left, right] = await Promise.all([digest(a), digest(b)]);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  return difference === 0;
}

/** Migration seam: look up a code in KV/D1 here and return its identity, never the code. */
export async function validateAccessCode(code: string, env: AuthEnv): Promise<CDIdentity | null> {
  return env.CD_ACCESS_CODE && await equal(code, env.CD_ACCESS_CODE)
    ? { subject: 'physical-edition', edition: null } : null;
}
export function isConfigured(env: AuthEnv) {
  return !!env.CD_ACCESS_CODE && (env.CD_SESSION_SECRET?.length ?? 0) >= 32;
}
function encode(value: Uint8Array) { return btoa(String.fromCharCode(...value)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, ''); }
function decode(value: string) { return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), (char) => char.charCodeAt(0)); }
async function key(secret: string) { return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']); }
export async function createSession(identity: CDIdentity, env: AuthEnv, now = Date.now()) {
  const body = encode(encoder.encode(JSON.stringify({ v: 1, ...identity, exp: Math.floor(now / 1000) + SESSION_SECONDS })));
  const signature = await crypto.subtle.sign('HMAC', await key(env.CD_SESSION_SECRET!), encoder.encode(body));
  return `${body}.${encode(new Uint8Array(signature))}`;
}
export async function readSession(request: Request, env: AuthEnv, now = Date.now()): Promise<CDIdentity | null> {
  if (!isConfigured(env)) return null;
  const token = request.headers.get('Cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  if (!token || token.length > 2048) return null;
  try {
    const [body, signature, extra] = token.split('.');
    if (!body || !signature || extra !== undefined) return null;
    if (!await crypto.subtle.verify('HMAC', await key(env.CD_SESSION_SECRET!), decode(signature), encoder.encode(body))) return null;
    const session = JSON.parse(new TextDecoder().decode(decode(body)));
    if (session.v !== 1 || typeof session.subject !== 'string' || !session.subject || !Number.isFinite(session.exp) || session.exp <= now / 1000 || session.exp > now / 1000 + SESSION_SECONDS + 60) return null;
    if (session.edition !== null && typeof session.edition !== 'string') return null;
    return { subject: session.subject, edition: session.edition };
  } catch { return null; }
}
export function sessionCookie(token: string, maxAge = SESSION_SECONDS) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

import type { Plugin, Connect } from 'vite';
import { loadEnv } from 'vite';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { handleCDRequest, type CDEnv, type PrivateBucket } from './api';
import audioManifest from './audio-manifest.json';

/** Local development only. The same API handler runs on Cloudflare in production. */
export function cdLocalAPI(mode: string, storageOverride?: PrivateBucket): Plugin {
  const root = resolve('private/cd');
  function filePath(key: string) {
    const original = Object.values(audioManifest).find((track) => track.download.key === key);
    if (original) {
      const sourceRoot = resolve('psichoZTracks');
      const source = resolve(sourceRoot, original.sourceFilename);
      if (!source.startsWith(sourceRoot + sep)) throw new Error('Invalid source path');
      return source;
    }
    const path = resolve(root, key);
    if (!path.startsWith(root + sep)) throw new Error('Invalid private path');
    return path;
  }
  const bucket: PrivateBucket = {
    async head(key) {
      try {
        const info = await stat(filePath(key));
        return info.isFile() ? { size: info.size, httpEtag: `"${info.size}-${info.mtimeMs}"` } : null;
      } catch { return null; }
    },
    async get(key, options) {
      const info = await this.head(key);
      if (!info) return null;
      const range = options?.range;
      return { ...info, body: Readable.toWeb(createReadStream(filePath(key), range ? { start: range.offset, end: range.offset + range.length - 1 } : undefined)) as ReadableStream<Uint8Array> };
    },
  };
  const middleware: Connect.NextHandleFunction = async (req, res, next) => {
    if (req.url?.split('?')[0] === '/cd') {
      const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
      res.writeHead(308, { Location: `/cd/${query}` }).end(); return;
    }
    if (!req.url?.startsWith('/api/cd-')) { next(); return; }
    // Never enable this local file adapter on a remotely addressed host.
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/u.test(req.headers.host ?? '')) { res.writeHead(403).end(); return; }
    const values = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
    const env: CDEnv = { CD_ACCESS_CODE: values.CD_ACCESS_CODE, CD_SESSION_SECRET: values.CD_SESSION_SECRET, CD_BUCKET: storageOverride ?? bucket };
    try {
      const chunks: Buffer[] = []; let length = 0;
      for await (const chunk of req) {
        length += chunk.length;
        if (length > 1024) { res.writeHead(413).end(); return; }
        chunks.push(chunk);
      }
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(',') : value);
      const request = new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : Buffer.concat(chunks) });
      const response = await handleCDRequest(request, env);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) Readable.fromWeb(response.body as import('node:stream/web').ReadableStream).pipe(res);
      else res.end();
    } catch { res.writeHead(503, { 'Content-Type': 'application/json' }).end('{"error":"unavailable"}'); }
  };
  return {
    name: 'psicoz-local-cd-api',
    config() {
      return { server: { fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/private/**', '**/psichoZTracks/**'] } } };
    },
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
}

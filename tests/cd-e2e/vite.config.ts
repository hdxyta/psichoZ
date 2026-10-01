import { defineConfig } from 'vite';
import { cdLocalAPI } from '../../server/cd/local-plugin';
import { cdFiles } from '../../server/cd/catalog';
import { album } from '../../src/config/site';

// Isolated server fixture: verifies native browser downloads through the real API.
// No fixture or object is written into public/, dist/ or the production manifest.
const body = new TextEncoder().encode('collector download test fixture');
// Exercise post-release transfers only in this isolated test process.
album.releaseDate = '2000-01-01T00:00:00-03:00';
for (const track of Object.values(cdFiles)) Object.assign(track, { durationSeconds: null, stream: null, download: null, peaks: null });
cdFiles['track-01'].download = { key: 'fixture', filename: 'test-only.txt', contentType: 'text/plain' };
export default defineConfig({ plugins: [cdLocalAPI('test', {
  async head(key) { return key === 'fixture' ? { size: body.length, httpEtag: '"fixture"' } : null; },
  async get(key, options) {
    if (key !== 'fixture') return null;
    const range = options?.range;
    const bytes = range ? body.slice(range.offset, range.offset + range.length) : body;
    return { size: body.length, httpEtag: '"fixture"', body: new Response(bytes).body! };
  },
})] });

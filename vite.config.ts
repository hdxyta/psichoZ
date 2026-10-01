import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import { assetUrl } from './src/config/site.ts';

export default defineConfig(({ mode }) => ({
  plugins: [{
    name: 'psicoz-public-art-origin',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const env = loadEnv(mode, process.cwd(), 'VITE_');
        const assets = `${assetUrl('assets', env.VITE_ASSET_BASE_URL ?? '')}/`;
        return html.replaceAll('/assets/', assets);
      },
    },
  }],
  test: { include: ['tests/unit/**/*.test.ts'] },
  build: { target: 'es2022' },
}));

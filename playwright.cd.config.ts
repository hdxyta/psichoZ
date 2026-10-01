import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/cd-e2e', fullyParallel: true, workers: 2, retries: 0,
  reporter: [['list']], outputDir: 'test-results/cd',
  use: { baseURL: 'http://127.0.0.1:4175', channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', launchOptions: { args: ['--mute-audio'] }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run preview -- --config tests/cd-e2e/vite.config.ts --port 4175 --strictPort', url: 'http://127.0.0.1:4175', reuseExistingServer: false,
    env: { CD_ACCESS_CODE: 'collector-e2e-only', CD_SESSION_SECRET: 'collector-e2e-secret-not-for-production-0123456789' },
  },
});

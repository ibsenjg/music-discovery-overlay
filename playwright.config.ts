import { defineConfig } from '@playwright/test';

const browserChannel = process.env.CI ? 'chromium' : 'chrome';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: browserChannel,
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --config vite.mock.config.ts',
    url: 'http://127.0.0.1:4173/mock/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});

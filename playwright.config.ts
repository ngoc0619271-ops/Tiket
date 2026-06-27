import { defineConfig, devices } from '@playwright/test';

// When PLAYWRIGHT_BASE_URL points at a live deployment we test the real prod app
// and do NOT boot a local dev server.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3001}`;
const isRemote = !!process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 180_000,
  reporter: [['list']],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } }],

  ...(isRemote
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:3001',
          reuseExistingServer: true,
          timeout: 60_000,
        },
      }),
});

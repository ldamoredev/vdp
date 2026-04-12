import { defineConfig } from '@playwright/test';

const PLAYWRIGHT_BACKEND_PORT = 43100;
const PLAYWRIGHT_FRONTEND_PORT = 43101;
const PLAYWRIGHT_DATABASE_URL = 'postgresql://test:test@localhost:5433/vdp_test';
const PLAYWRIGHT_API_URL = `http://127.0.0.1:${PLAYWRIGHT_BACKEND_PORT}/api/v1`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: `http://127.0.0.1:${PLAYWRIGHT_FRONTEND_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'pnpm --dir ../.. test:e2e:web:backend',
      port: PLAYWRIGHT_BACKEND_PORT,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        DATABASE_URL: PLAYWRIGHT_DATABASE_URL,
        PORT: String(PLAYWRIGHT_BACKEND_PORT),
      },
    },
    {
      command: `pnpm exec next dev --hostname 127.0.0.1 --port ${PLAYWRIGHT_FRONTEND_PORT}`,
      port: PLAYWRIGHT_FRONTEND_PORT,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_API_URL: PLAYWRIGHT_API_URL,
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});

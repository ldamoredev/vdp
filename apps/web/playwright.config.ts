import { defineConfig } from '@playwright/test';

const PLAYWRIGHT_BACKEND_PORT = 43100;
const PLAYWRIGHT_FRONTEND_PORT = 43101;
const PLAYWRIGHT_DATABASE_URL = 'postgresql://test:test@localhost:5433/vdp_test';
const PLAYWRIGHT_API_PROXY_TARGET = `http://127.0.0.1:${PLAYWRIGHT_BACKEND_PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  // The local dev backend (single tsx process, small pg pool) gets briefly
  // saturated by the dashboard's burst of parallel queries across rapid
  // navigations, which can flake the auth bootstrap. Retry to absorb that.
  retries: 2,
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
        // Headroom for the parallel dashboard query bursts across rapid e2e
        // navigations, and a generous acquire timeout so the slower dev backend
        // queues requests under load instead of failing them.
        DB_POOL_MAX: '30',
        DB_CONN_TIMEOUT_MS: '20000',
        // The suite's rapid navigations exceed any human-scale per-IP budget.
        RATE_LIMIT_MAX: '2000',
      },
    },
    {
      command: `pnpm exec vite --host 127.0.0.1 --port ${PLAYWRIGHT_FRONTEND_PORT} --strictPort`,
      port: PLAYWRIGHT_FRONTEND_PORT,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        // The Vite dev server proxies /api to the e2e backend (same-origin cookies).
        VITE_API_PROXY_TARGET: PLAYWRIGHT_API_PROXY_TARGET,
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

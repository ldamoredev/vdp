import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    root: "src",
    // DB-backed suites share one test database and truncate it between tests.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    projects: [
      {
        test: {
          name: "unit",
          include: ["**/__tests__/domain/**/*.test.ts", "**/__tests__/services/**/*.test.ts", "**/__tests__/observability/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["**/__tests__/integration/**/*.test.ts"],
          globalSetup: ["test/global-setup.ts"],
          pool: "forks",
          poolOptions: { forks: { singleFork: true } },
        },
      },
      {
        test: {
          name: "e2e",
          include: ["**/__tests__/e2e/**/*.test.ts"],
          globalSetup: ["test/global-setup.ts"],
          pool: "forks",
          poolOptions: { forks: { singleFork: true } },
        },
      },
    ],
  },
});

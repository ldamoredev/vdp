import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    root: "src",
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
          globalSetup: ["modules/tasks/__tests__/integration/setup.ts"],
          pool: "forks",
          poolOptions: { forks: { singleFork: true } },
        },
      },
      {
        test: {
          name: "e2e",
          include: ["**/__tests__/e2e/**/*.test.ts"],
          globalSetup: ["modules/tasks/__tests__/integration/setup.ts"],
          pool: "forks",
          poolOptions: { forks: { singleFork: true } },
        },
      },
    ],
  },
});

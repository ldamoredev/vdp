import { defineConfig } from "vitest/config";
import * as path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  // Use the automatic JSX runtime so .test.tsx files don't need an explicit
  // React import (component tests via @testing-library/react).
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    include: ["src/**/__tests__/**/*.test.ts", "src/**/__tests__/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});

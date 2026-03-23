import { defineConfig } from "vitest/config";
import * as path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  test: {
    include: ["src/**/__tests__/**/*.test.ts"],
  },
});

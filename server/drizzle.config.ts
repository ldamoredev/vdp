import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./src/modules/common/infrastructure/agents/schema.ts",
    "./src/modules/wallet/schema.ts",
    // "./src/modules/health/schema.ts",
    "./src/modules/tasks/infrastructure/db/schema.ts",
    "./src/modules/tasks/infrastructure/db/embeddings-schema.ts",
  ],
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

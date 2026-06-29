import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./src/modules/auth/infrastructure/db/schema.ts",
    "./src/modules/common/infrastructure/agents/schema.ts",
    "./src/modules/wallet/infrastructure/db/schema.ts",
    "./src/modules/projects/infrastructure/db/schema.ts",
    "./src/modules/objectives/infrastructure/db/schema.ts",
    "./src/modules/tasks/infrastructure/db/schema.ts",
    "./src/modules/tasks/infrastructure/db/embeddings-schema.ts",
    "./src/modules/health/infrastructure/db/schema.ts",
    "./src/modules/common/infrastructure/storage/schema.ts",
  ],
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

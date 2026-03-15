import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./src/domains/wallet/schema.ts",
    "./src/domains/health/schema.ts",
  ],
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/vdp",
  },
});

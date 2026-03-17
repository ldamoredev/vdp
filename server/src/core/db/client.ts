import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as walletSchema from "../../modules/wallet/schema.js";
import * as healthSchema from "../../modules/health/schema.js";
import * as tasksSchema from "../../modules/tasks/schema.js";

// Aggregate all domain schemas here. As new domains are added,
// import and spread their schemas into this object.
const schema = {
  ...walletSchema,
  ...healthSchema,
  ...tasksSchema
};

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/vdp",
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;

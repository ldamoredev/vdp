import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

export class Database {
  public query;

  constructor(connectionString?: string) {
    const pool = new pg.Pool({
      connectionString: connectionString ?? process.env.DATABASE_URL,
      // Overridable via env for load-heavier environments (e.g. e2e) where the
      // dashboard's parallel query fan-out can briefly saturate a small pool and
      // a slow dev backend makes the default acquire timeout too tight.
      max: Number(process.env.DB_POOL_MAX) || 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT_MS) || 5_000,
    });
    // Repositories use the SQL builder API (select/insert/update) with their
    // module's own table objects, so no composed schema is needed here.
    this.query = drizzle(pool);
  }
}

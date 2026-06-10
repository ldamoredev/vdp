import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as walletSchema from '../../../wallet/infrastructure/db/schema';
import * as agentSchema from '../../infrastructure/agents/schema';
import * as authSchema from '../../../auth/infrastructure/db/schema';
import * as tasksSchema from '../../../tasks/infrastructure/db/schema';
import * as embeddingsSchema from '../../../tasks/infrastructure/db/embeddings-schema';

export class Database {
  public query;
  private schema = {
    ...walletSchema,
    ...agentSchema,
    ...authSchema,
    ...tasksSchema,
    ...embeddingsSchema,
  };

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
    this.query = drizzle(pool, { schema: this.schema });
  }
}

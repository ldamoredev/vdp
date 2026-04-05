import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as walletSchema from '../../../wallet/schema';
import * as agentSchema from '../../infrastructure/agents/schema';
import * as authSchema from '../../../auth/infrastructure/schema';
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
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
    this.query = drizzle(pool, { schema: this.schema });
  }
}

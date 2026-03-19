import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as walletSchema from '../../../wallet/schema';
import * as healthSchema from '../../../health/schema';
import * as tasksSchema from '../../../tasks/infrastructure/db/schema';

export class Database {
  public query;
  private schema = {
    ...walletSchema,
    ...healthSchema,
    ...tasksSchema
  };

  constructor() {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.query = drizzle(pool, { schema: this.schema });
  }
}

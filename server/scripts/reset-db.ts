import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = new pg.Client({ connectionString });

async function resetDatabase() {
  await client.connect();

  try {
    await client.query(`
      DROP SCHEMA IF EXISTS core CASCADE;
      DROP SCHEMA IF EXISTS tasks CASCADE;
      DROP SCHEMA IF EXISTS wallet CASCADE;
      DROP SCHEMA IF EXISTS health CASCADE;
      DROP SCHEMA IF EXISTS drizzle CASCADE;
      DROP TABLE IF EXISTS public.__drizzle_migrations;
    `);

    console.log("Database schemas and migration journal cleared.");
  } finally {
    await client.end();
  }
}

resetDatabase().catch(async (error) => {
  console.error("Failed to reset database", error);
  try {
    await client.end();
  } catch {}
  process.exit(1);
});

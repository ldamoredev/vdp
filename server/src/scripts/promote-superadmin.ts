import pg from 'pg';

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
    console.error('Usage: tsx src/scripts/promote-superadmin.ts <email>');
    process.exit(1);
}

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
    const result = await pool.query(
        `UPDATE core.users
         SET role = 'superadmin', updated_at = NOW()
         WHERE email = $1`,
        [email],
    );
    console.log(`Promoted ${result.rowCount ?? 0} user(s) to superadmin for ${email}`);
} finally {
    await pool.end();
}

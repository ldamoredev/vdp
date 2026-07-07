import path from 'node:path';
import pg from 'pg';

import { exportOwnerData } from './export/OwnerDataExporter';

const email = process.argv[2]?.trim().toLowerCase();
const outDirArg = process.argv[3];

if (!email) {
    console.error('Usage: tsx src/scripts/export-owner-data.ts <email> [outDir]');
    process.exit(1);
}

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
}

const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
const outDir = path.resolve(outDirArg ?? `vdp-export-${stamp}`);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
    const manifest = await exportOwnerData(pool, { email, outDir });
    const totalRows = Object.values(manifest.tables).reduce((a, b) => a + b, 0);
    console.log(`Exported ${totalRows} rows across ${Object.keys(manifest.tables).length} tables`);
    console.log(`Medical attachments written: ${manifest.attachments}`);
    for (const skipped of manifest.skipped) {
        console.log(`Skipped ${skipped.table}: ${skipped.reason}`);
    }
    console.log(`Output: ${outDir}`);
} finally {
    await pool.end();
}

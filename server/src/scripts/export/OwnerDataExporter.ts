import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
    DbTable,
    EXPORT_REGISTRY,
    EXPORT_SCHEMAS,
    ExportDomain,
    TableExportRule,
    diffTables,
} from './export-registry';

/** Minimal query surface so the exporter works with pg.Pool or pg.Client. */
export type Queryable = {
    query(text: string, params?: unknown[]): Promise<{ rows: Array<Record<string, unknown>> }>;
};

export type ExportManifest = {
    generatedAt: string;
    email: string;
    userId: string;
    /** Row counts per exported `schema.table`. */
    tables: Record<string, number>;
    /** Number of medical attachment binaries written. */
    attachments: number;
    skipped: Array<{ table: string; reason: string }>;
};

export type ExportOptions = {
    email: string;
    outDir: string;
};

export async function exportOwnerData(db: Queryable, options: ExportOptions): Promise<ExportManifest> {
    const email = options.email.trim().toLowerCase();
    const userId = await resolveUserId(db, email);
    await assertRegistryComplete(db);

    const manifest: ExportManifest = {
        generatedAt: new Date().toISOString(),
        email,
        userId,
        tables: {},
        attachments: 0,
        skipped: EXPORT_REGISTRY.filter((r) => r.mode === 'skip').map((r) => ({
            table: `${r.schema}.${r.table}`,
            reason: r.reason,
        })),
    };

    await mkdir(options.outDir, { recursive: true });

    for (const [domain, rules] of rulesByDomain()) {
        const domainData: Record<string, Array<Record<string, unknown>>> = {};
        for (const rule of rules) {
            const rows = await fetchRows(db, rule, userId);
            const tableKey = `${rule.schema}.${rule.table}`;
            domainData[tableKey] = rows;
            manifest.tables[tableKey] = rows.length;
        }
        await writeFile(path.join(options.outDir, `${domain}.json`), JSON.stringify(domainData, null, 2));
    }

    manifest.attachments = await exportMedicalAttachments(db, userId, options.outDir);

    await writeFile(path.join(options.outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    return manifest;
}

async function resolveUserId(db: Queryable, email: string): Promise<string> {
    const result = await db.query('SELECT id FROM core.users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
        throw new Error(`No user found for email ${email}`);
    }
    return result.rows[0].id as string;
}

/** Refuses to export when the live schema and the registry drifted, so a new
 *  domain table can never be silently absent from the export. */
async function assertRegistryComplete(db: Queryable): Promise<void> {
    const result = await db.query(
        `SELECT table_schema AS schema, table_name AS table
         FROM information_schema.tables
         WHERE table_schema = ANY($1) AND table_type = 'BASE TABLE'`,
        [[...EXPORT_SCHEMAS]],
    );
    const diff = diffTables(result.rows as DbTable[], EXPORT_REGISTRY);

    const problems: string[] = [];
    if (diff.unregistered.length > 0) {
        problems.push(
            `not in the export registry: ${diff.unregistered.map((t) => `${t.schema}.${t.table}`).join(', ')}`,
        );
    }
    if (diff.missing.length > 0) {
        problems.push(
            `in the registry but missing from the database: ${diff.missing.map((t) => `${t.schema}.${t.table}`).join(', ')}`,
        );
    }
    if (problems.length > 0) {
        throw new Error(
            `Export registry is out of sync with the database — ${problems.join('; ')}. ` +
                'Classify the table in server/src/scripts/export/export-registry.ts before exporting.',
        );
    }
}

function rulesByDomain(): Map<ExportDomain, TableExportRule[]> {
    const byDomain = new Map<ExportDomain, TableExportRule[]>();
    for (const rule of EXPORT_REGISTRY) {
        if (rule.mode === 'skip') continue;
        const rules = byDomain.get(rule.domain) ?? [];
        rules.push(rule);
        byDomain.set(rule.domain, rules);
    }
    return byDomain;
}

async function fetchRows(
    db: Queryable,
    rule: TableExportRule,
    userId: string,
): Promise<Array<Record<string, unknown>>> {
    // Identifiers come from the static registry, never from input.
    const table = `"${rule.schema}"."${rule.table}"`;
    if (rule.mode === 'owner') {
        const result = await db.query(`SELECT * FROM ${table} WHERE "${rule.ownerColumn}" = $1`, [userId]);
        return result.rows;
    }
    const result = await db.query(`SELECT * FROM ${table}`);
    return result.rows;
}

async function exportMedicalAttachments(db: Queryable, userId: string, outDir: string): Promise<number> {
    const result = await db.query(
        `SELECT a.id, a.record_id, a.filename, b.content
         FROM medical.attachments a
         JOIN core.file_blobs b ON b.ref = a.storage_ref
         WHERE a.owner_user_id = $1`,
        [userId],
    );

    const usedPaths = new Set<string>();
    for (const row of result.rows) {
        const dir = path.join(outDir, 'medical-attachments', String(row.record_id));
        await mkdir(dir, { recursive: true });
        const safeName = sanitizeFilename(String(row.filename), String(row.id));
        let target = path.join(dir, safeName);
        if (usedPaths.has(target)) {
            // Same record + same filename: prefix with the attachment id so no file overwrites another.
            target = path.join(dir, `${String(row.id)}-${safeName}`);
        }
        usedPaths.add(target);
        await writeFile(target, row.content as Buffer);
    }
    return result.rows.length;
}

function sanitizeFilename(filename: string, fallbackId: string): string {
    const base = path.basename(filename).replace(/[^\w.\-()\s]/g, '_').trim();
    return base.length > 0 ? base : `${fallbackId}.bin`;
}

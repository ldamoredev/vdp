import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import pg from 'pg';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TEST_DATABASE_CONNECTION_STRING, testDb } from '../../../test/test-database';
import { ALL_TEST_USERS, PRIMARY_TEST_USER, SECONDARY_TEST_USER } from '../../../test/testUsers';
import { exportOwnerData } from '../../export/OwnerDataExporter';

const pool = new pg.Pool({ connectionString: TEST_DATABASE_CONNECTION_STRING });
const ownerId = PRIMARY_TEST_USER.id;
const otherId = SECONDARY_TEST_USER.id;

let outDir: string;

beforeEach(async () => {
    await testDb.truncate({ users: ALL_TEST_USERS });
    outDir = await mkdtemp(path.join(tmpdir(), 'vdp-export-'));
});

afterEach(async () => {
    await rm(outDir, { recursive: true, force: true });
});

afterAll(async () => {
    await pool.end();
});

async function seedBasicData() {
    await pool.query(
        `INSERT INTO tasks.tasks (owner_user_id, title, scheduled_date) VALUES
         ($1, 'Owner task', CURRENT_DATE),
         ($2, 'Intruder task', CURRENT_DATE)`,
        [ownerId, otherId],
    );
    await pool.query(
        `INSERT INTO wallet.accounts (owner_user_id, name, currency, type) VALUES
         ($1, 'Banco', 'ARS', 'bank')`,
        [ownerId],
    );
    await pool.query(
        `INSERT INTO wallet.exchange_rates (from_currency, to_currency, rate, type, date) VALUES
         ('USD', 'ARS', 1234.5, 'mep', CURRENT_DATE)`,
    );
}

async function seedMedicalAttachment(userId: string, filename: string, content: string): Promise<string> {
    const blob = await pool.query(
        `INSERT INTO core.file_blobs (content, size_bytes) VALUES ($1, $2) RETURNING ref`,
        [Buffer.from(content), content.length],
    );
    const record = await pool.query(
        `INSERT INTO medical.records (owner_user_id, type, title, record_date) VALUES
         ($1, 'study', 'Estudio', CURRENT_DATE) RETURNING id`,
        [userId],
    );
    await pool.query(
        `INSERT INTO medical.attachments (owner_user_id, record_id, filename, mime_type, size_bytes, storage_ref)
         VALUES ($1, $2, $3, 'application/pdf', $4, $5)`,
        [userId, record.rows[0].id, filename, content.length, blob.rows[0].ref],
    );
    return record.rows[0].id as string;
}

async function readDomainFile(domain: string): Promise<Record<string, Array<Record<string, unknown>>>> {
    return JSON.parse(await readFile(path.join(outDir, `${domain}.json`), 'utf8'));
}

describe('exportOwnerData', () => {
    it('exports only rows owned by the requested user', async () => {
        await seedBasicData();

        await exportOwnerData(pool, { email: PRIMARY_TEST_USER.email, outDir });

        const tasks = await readDomainFile('tasks');
        expect(tasks['tasks.tasks']).toHaveLength(1);
        expect(tasks['tasks.tasks'][0]).toMatchObject({ title: 'Owner task', owner_user_id: ownerId });

        const wallet = await readDomainFile('wallet');
        expect(wallet['wallet.accounts']).toHaveLength(1);
        expect(wallet['wallet.accounts'][0]).toMatchObject({ name: 'Banco' });
    });

    it('includes global reference tables without owner filtering', async () => {
        await seedBasicData();

        await exportOwnerData(pool, { email: PRIMARY_TEST_USER.email, outDir });

        const wallet = await readDomainFile('wallet');
        expect(wallet['wallet.exchange_rates']).toHaveLength(1);
        expect(wallet['wallet.exchange_rates'][0]).toMatchObject({ from_currency: 'USD', to_currency: 'ARS' });
    });

    it('writes medical attachment metadata and the binary next to it, owner-scoped', async () => {
        const recordId = await seedMedicalAttachment(ownerId, 'informe.pdf', 'owner-bytes');
        await seedMedicalAttachment(otherId, 'ajeno.pdf', 'other-bytes');

        await exportOwnerData(pool, { email: PRIMARY_TEST_USER.email, outDir });

        const medical = await readDomainFile('medical');
        expect(medical['medical.records']).toHaveLength(1);
        expect(medical['medical.attachments']).toHaveLength(1);

        const attachmentPath = path.join(outDir, 'medical-attachments', recordId, 'informe.pdf');
        expect(await readFile(attachmentPath, 'utf8')).toBe('owner-bytes');
        expect(existsSync(path.join(outDir, 'medical-attachments'))).toBe(true);

        const written = await readFile(attachmentPath);
        expect(written.length).toBe('owner-bytes'.length);
    });

    it('writes a manifest with per-table row counts', async () => {
        await seedBasicData();

        const manifest = await exportOwnerData(pool, { email: PRIMARY_TEST_USER.email, outDir });

        expect(manifest.email).toBe(PRIMARY_TEST_USER.email);
        expect(manifest.userId).toBe(ownerId);
        expect(manifest.tables['tasks.tasks']).toBe(1);
        expect(manifest.tables['wallet.accounts']).toBe(1);

        const onDisk = JSON.parse(await readFile(path.join(outDir, 'manifest.json'), 'utf8'));
        expect(onDisk.tables['tasks.tasks']).toBe(1);
    });

    it('does not overwrite attachments that share a filename on the same record', async () => {
        const recordId = await seedMedicalAttachment(ownerId, 'informe.pdf', 'primer-informe');
        const blob = await pool.query(
            `INSERT INTO core.file_blobs (content, size_bytes) VALUES ($1, $2) RETURNING ref`,
            [Buffer.from('segundo-informe'), 'segundo-informe'.length],
        );
        await pool.query(
            `INSERT INTO medical.attachments (owner_user_id, record_id, filename, mime_type, size_bytes, storage_ref)
             VALUES ($1, $2, 'informe.pdf', 'application/pdf', $3, $4)`,
            [ownerId, recordId, 'segundo-informe'.length, blob.rows[0].ref],
        );

        const manifest = await exportOwnerData(pool, { email: PRIMARY_TEST_USER.email, outDir });

        expect(manifest.attachments).toBe(2);
        const dir = path.join(outDir, 'medical-attachments', recordId);
        const files = await readdir(dir);
        expect(files).toHaveLength(2);
        const contents = await Promise.all(files.map((f) => readFile(path.join(dir, f), 'utf8')));
        expect(contents.sort()).toEqual(['primer-informe', 'segundo-informe']);
    });

    it('refuses to run when a domain table is missing from the registry', async () => {
        await pool.query('CREATE TABLE wallet.rogue_table (id INT)');
        try {
            await expect(exportOwnerData(pool, { email: PRIMARY_TEST_USER.email, outDir })).rejects.toThrow(
                /wallet\.rogue_table/,
            );
        } finally {
            await pool.query('DROP TABLE wallet.rogue_table');
        }
    });

    it('fails for an email that does not exist', async () => {
        await expect(exportOwnerData(pool, { email: 'nadie@vdp.local', outDir })).rejects.toThrow(/nadie@vdp.local/);
    });
});

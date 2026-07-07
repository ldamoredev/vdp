import { describe, expect, it } from 'vitest';

import { EXPORT_REGISTRY, diffTables, type DbTable } from '../../export/export-registry';

const registryTables: DbTable[] = EXPORT_REGISTRY.map(({ schema, table }) => ({ schema, table }));

describe('diffTables', () => {
    it('reports no differences when the database matches the registry exactly', () => {
        const diff = diffTables(registryTables, EXPORT_REGISTRY);

        expect(diff.unregistered).toEqual([]);
        expect(diff.missing).toEqual([]);
    });

    it('flags a database table that is not in the registry', () => {
        const actual = [...registryTables, { schema: 'wallet', table: 'budgets' }];

        const diff = diffTables(actual, EXPORT_REGISTRY);

        expect(diff.unregistered).toEqual([{ schema: 'wallet', table: 'budgets' }]);
        expect(diff.missing).toEqual([]);
    });

    it('flags a registry entry whose table no longer exists in the database', () => {
        const actual = registryTables.filter((t) => !(t.schema === 'inbox' && t.table === 'inbox_items'));

        const diff = diffTables(actual, EXPORT_REGISTRY);

        expect(diff.unregistered).toEqual([]);
        expect(diff.missing).toEqual([{ schema: 'inbox', table: 'inbox_items' }]);
    });
});

describe('EXPORT_REGISTRY', () => {
    it('has no duplicate schema.table entries', () => {
        const keys = EXPORT_REGISTRY.map((r) => `${r.schema}.${r.table}`);

        expect(new Set(keys).size).toBe(keys.length);
    });

    it('assigns every table to a domain export file except skipped ones', () => {
        for (const rule of EXPORT_REGISTRY) {
            if (rule.mode === 'skip') continue;
            expect(rule.domain, `${rule.schema}.${rule.table} needs a domain`).toBeTruthy();
        }
    });
});

import { describe, expect, it, vi } from 'vitest';

import { Client } from '../../domain/Client';

describe('Client', () => {
    it('renames and archives a client', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 18, 9, 0, 0));
        const client = Client.fromSnapshot({
            id: 'client-1',
            name: 'Acme',
            status: 'active',
            archivedAt: null,
            createdAt: new Date(2026, 5, 17, 9, 0, 0),
            updatedAt: new Date(2026, 5, 17, 9, 0, 0),
        });

        client.rename('Acme Corp');
        client.archive();

        expect(client.toSnapshot()).toMatchObject({
            name: 'Acme Corp',
            status: 'archived',
            archivedAt: new Date(2026, 5, 18, 9, 0, 0),
            updatedAt: new Date(2026, 5, 18, 9, 0, 0),
        });
        vi.useRealTimers();
    });
});

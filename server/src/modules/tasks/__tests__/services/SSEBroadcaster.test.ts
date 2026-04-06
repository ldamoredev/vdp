import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SSEBroadcaster } from '../../../common/base/sse/SSEBroadcaster';

type FakeResponse = {
    writeHead: ReturnType<typeof vi.fn>;
    write: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
};

function createResponse(): FakeResponse {
    return {
        writeHead: vi.fn(),
        write: vi.fn(),
        end: vi.fn(),
    };
}

describe('SSEBroadcaster', () => {
    let broadcaster: SSEBroadcaster;

    beforeEach(() => {
        broadcaster = new SSEBroadcaster(undefined, 60_000);
    });

    it('broadcasts live events only to the target users clients', () => {
        const userA = createResponse();
        const userB = createResponse();

        broadcaster.addClient(userA as never, 'user-a');
        broadcaster.addClient(userB as never, 'user-b');

        broadcaster.broadcastToUser('user-a', 'insight', { title: 'Privado A' });

        expect(userA.write).toHaveBeenCalledWith(
            expect.stringContaining('event: insight'),
        );
        expect(userA.write).toHaveBeenCalledWith(
            expect.stringContaining('Privado A'),
        );
        expect(userB.write).not.toHaveBeenCalledWith(
            expect.stringContaining('event: insight'),
        );
    });

    it('tracks connected clients by user', () => {
        const userA = createResponse();
        const userB = createResponse();

        broadcaster.addClient(userA as never, 'user-a');
        broadcaster.addClient(userB as never, 'user-b');

        expect(broadcaster.hasClients('user-a')).toBe(true);
        expect(broadcaster.hasClients('user-b')).toBe(true);
        expect(broadcaster.hasClients('missing-user')).toBe(false);

        broadcaster.removeClient(userA as never);

        expect(broadcaster.hasClients('user-a')).toBe(false);
        expect(broadcaster.hasClients('user-b')).toBe(true);
    });
});

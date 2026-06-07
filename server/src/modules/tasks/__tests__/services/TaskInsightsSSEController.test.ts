import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it } from 'vitest';

import { SSEBroadcaster } from '../../../common/base/sse/SSEBroadcaster';
import { TaskInsightsStore } from '../../services/TaskInsightsStore';
import { TaskInsightsSSEController } from '../../infrastructure/routes/TaskInsightsSSEController';

type StreamHandler = (request: unknown, reply: unknown) => Promise<void>;

function createRawResponse() {
    const writes: string[] = [];
    return {
        writes,
        writeHead: () => undefined,
        write: (chunk: string) => {
            writes.push(chunk);
            return true;
        },
        end: () => undefined,
    };
}

function createStreamContext(userId: string) {
    const raw = createRawResponse();
    const socket = new EventEmitter();
    const request = {
        headers: { origin: 'http://localhost:3000' },
        auth: { userId },
        socket,
    };
    const reply = {
        hijack: () => undefined,
        raw,
    };
    return { raw, socket, request, reply };
}

function getStreamHandler(controller: TaskInsightsSSEController): StreamHandler {
    let handler: StreamHandler | undefined;
    const routes = {
        get(path: string, optionsOrHandler: unknown, maybeHandler?: unknown) {
            const candidate = (maybeHandler ?? optionsOrHandler) as StreamHandler;
            if (path === '/stream') handler = candidate;
            return routes;
        },
    };
    (controller as unknown as { registerRoutes: (r: unknown) => void }).registerRoutes(routes);
    if (!handler) throw new Error('stream handler not registered');
    return handler;
}

describe('TaskInsightsSSEController.stream', () => {
    let broadcaster: SSEBroadcaster;
    let store: TaskInsightsStore;
    let controller: TaskInsightsSSEController;
    let stream: StreamHandler;

    beforeEach(() => {
        broadcaster = new SSEBroadcaster(undefined, 60_000);
        store = new TaskInsightsStore();
        controller = new TaskInsightsSSEController(broadcaster, store);
        stream = getStreamHandler(controller);
    });

    it('sends only the connecting users unread insights as the initial snapshot', async () => {
        store.addInsight({ userId: 'user-a', type: 'achievement', title: 'Privado A', message: 'A' });
        store.addInsight({ userId: 'user-b', type: 'warning', title: 'Privado B', message: 'B' });

        const { raw, request, reply } = createStreamContext('user-a');
        await stream(request, reply);

        const snapshotWrite = raw.writes.find((chunk) => chunk.startsWith('event: snapshot'));
        expect(snapshotWrite).toBeDefined();
        expect(snapshotWrite).toContain('Privado A');
        expect(snapshotWrite).not.toContain('Privado B');

        broadcaster.shutdown();
    });

    it('marks the snapshot read so a reconnect does not replay it', async () => {
        store.addInsight({ userId: 'user-a', type: 'achievement', title: 'Una vez', message: 'A' });

        const first = createStreamContext('user-a');
        await stream(first.request, first.reply);
        expect(first.raw.writes.some((chunk) => chunk.startsWith('event: snapshot'))).toBe(true);

        const second = createStreamContext('user-a');
        await stream(second.request, second.reply);
        expect(second.raw.writes.some((chunk) => chunk.startsWith('event: snapshot'))).toBe(false);

        broadcaster.shutdown();
    });

    it('registers the client and removes it when the socket closes', async () => {
        const { socket, request, reply } = createStreamContext('user-a');
        await stream(request, reply);

        expect(broadcaster.hasClients('user-a')).toBe(true);

        socket.emit('close');

        expect(broadcaster.hasClients('user-a')).toBe(false);

        broadcaster.shutdown();
    });
});

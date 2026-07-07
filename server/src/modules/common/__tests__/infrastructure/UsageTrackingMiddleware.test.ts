import Fastify, { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UsageEventRepository } from '../../base/usage/UsageEventRepository';
import { UsageTrackingMiddleware } from '../../infrastructure/usage/UsageTrackingMiddleware';
import { FakeUsageEventRepository } from '../fakes/FakeUsageEventRepository';

const USER_ID = '00000000-0000-0000-0000-000000000001';

async function buildApp(repo: UsageEventRepository, options?: { authenticated?: boolean }) {
    const app = Fastify({ logger: false });
    if (options?.authenticated !== false) {
        app.addHook('preHandler', async (request) => {
            request.auth = {
                isAuthenticated: true,
                userId: USER_ID,
                sessionId: 'test-session',
                role: 'user',
                email: 'test@vdp.local',
                displayName: 'Test',
            };
        });
    }
    await new UsageTrackingMiddleware(repo).plugin(app);
    app.get('/api/v1/tasks', async () => ({ ok: true }));
    app.get('/api/v1/tasks/:id', async () => ({ ok: true }));
    app.get('/api/health', async () => ({ ok: true }));
    app.get('/api/v1/boom', async () => {
        throw new Error('handler exploded');
    });
    await app.ready();
    return app;
}

async function flushFireAndForget() {
    await new Promise((resolve) => setImmediate(resolve));
}

describe('UsageTrackingMiddleware', () => {
    let repo: FakeUsageEventRepository;
    let app: FastifyInstance;

    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-07-07T15:00:00'));
        repo = new FakeUsageEventRepository();
    });

    afterEach(async () => {
        vi.useRealTimers();
        await app?.close();
    });

    it('records an authenticated API request with surface, action and local date', async () => {
        app = await buildApp(repo);

        const response = await app.inject({ method: 'GET', url: '/api/v1/tasks' });
        await flushFireAndForget();

        expect(response.statusCode).toBe(200);
        expect(repo.events).toEqual([
            { ownerUserId: USER_ID, surface: 'tasks', action: 'GET /tasks', occurredOn: '2026-07-07' },
        ]);
    });

    it('records the route pattern, not the concrete URL', async () => {
        app = await buildApp(repo);

        await app.inject({ method: 'GET', url: '/api/v1/tasks/abc-123' });
        await flushFireAndForget();

        expect(repo.events[0].action).toBe('GET /tasks/:id');
    });

    it('does not record unauthenticated requests', async () => {
        app = await buildApp(repo, { authenticated: false });

        await app.inject({ method: 'GET', url: '/api/v1/tasks' });
        await flushFireAndForget();

        expect(repo.events).toEqual([]);
    });

    it('does not record ignored routes', async () => {
        app = await buildApp(repo);

        await app.inject({ method: 'GET', url: '/api/health' });
        await flushFireAndForget();

        expect(repo.events).toEqual([]);
    });

    it('does not record failed requests', async () => {
        app = await buildApp(repo);

        const response = await app.inject({ method: 'GET', url: '/api/v1/boom' });
        await flushFireAndForget();

        expect(response.statusCode).toBe(500);
        expect(repo.events).toEqual([]);
    });

    it('never breaks the response when recording fails', async () => {
        app = await buildApp(repo);
        repo.failNext = true;

        const response = await app.inject({ method: 'GET', url: '/api/v1/tasks' });
        await flushFireAndForget();

        expect(response.statusCode).toBe(200);
        expect(repo.events).toEqual([]);
    });
});

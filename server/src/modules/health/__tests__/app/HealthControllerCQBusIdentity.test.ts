import { CQBus, Identity } from '@nbottarini/cqbus';
import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';

import { AuthContext } from '../../../common/http/AuthContext';
import { httpErrorHandler } from '../../../common/http/errors';
import { CreateHabitCommand } from '../../app/CreateHabitCommand';
import { GetHabitsOverviewQuery } from '../../app/GetHabitsOverviewQuery';
import { HealthController } from '../../infrastructure/routes/HealthController';

const authContext: AuthContext = {
    isAuthenticated: true,
    userId: 'user-1',
    sessionId: 'session-1',
    role: 'user',
    email: 'test@example.com',
    displayName: 'Test User',
};

describe('HealthController CQBus identity forwarding', () => {
    it('passes request auth as CQBus identity for habit routes', async () => {
        const bus = new CQBus();
        const identities: Identity[] = [];

        bus.registerHandler(GetHabitsOverviewQuery, () => ({
            handle: async (_query, identity) => {
                identities.push(identity);
                return { habits: [], date: '2026-06-16' };
            },
        }));
        bus.registerHandler(CreateHabitCommand, () => ({
            handle: async (command, identity) => {
                identities.push(identity);
                return {
                    id: 'habit-1',
                    name: command.input.name,
                    emoji: command.input.emoji ?? null,
                    archivedAt: null,
                    createdAt: new Date('2026-06-16T00:00:00.000Z'),
                    updatedAt: new Date('2026-06-16T00:00:00.000Z'),
                    completedToday: false,
                    streak: 0,
                    bestStreak: 0,
                    totalCompletions: 0,
                    lastCompletedDate: null,
                };
            },
        }));

        const app = Fastify({ logger: false });
        app.setErrorHandler(httpErrorHandler);
        app.addHook('preHandler', async (request) => {
            request.auth = authContext;
        });
        new HealthController(bus).register(app);

        const list = await app.inject({ method: 'GET', url: '/api/v1/health/habits' });
        const created = await app.inject({
            method: 'POST',
            url: '/api/v1/health/habits',
            payload: { name: 'Leer' },
        });

        await app.close();

        expect(list.statusCode).toBe(200);
        expect(created.statusCode).toBe(201);
        expect(identities).toHaveLength(2);
        expect(identities.every((identity) => identity.isAuthenticated)).toBe(true);
        expect(identities.every((identity) => identity.properties.userId === 'user-1')).toBe(true);
    });
});

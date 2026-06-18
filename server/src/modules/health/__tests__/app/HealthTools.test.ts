import { CQBus, Identity } from '@nbottarini/cqbus';
import { describe, expect, it } from 'vitest';

import { AuthContext } from '../../../common/http/AuthContext';
import { AuthContextStorage } from '../../../common/http/AuthContextStorage';
import { GetHabitsOverviewQuery } from '../../app/GetHabitsOverviewQuery';
import { HealthTools } from '../../infrastructure/agent/tools';

const authContext: AuthContext = {
    isAuthenticated: true,
    userId: 'user-1',
    sessionId: 'session-1',
    role: 'user',
    email: 'test@example.com',
    displayName: 'Test User',
};

describe('HealthTools', () => {
    it('executes CQBus requests with the current auth identity', async () => {
        const bus = new CQBus();
        const identities: Identity[] = [];

        bus.registerHandler(GetHabitsOverviewQuery, () => ({
            handle: async (_query, identity) => {
                identities.push(identity);
                return { habits: [], date: '2026-06-17' };
            },
        }));

        const authContextStorage = new AuthContextStorage();
        const listHabits = HealthTools.createHealthTools(bus, authContextStorage)
            .find((tool) => tool.name === 'list_habits')!;

        const result = await authContextStorage.runWithContext(authContext, () => listHabits.execute({}));

        expect(JSON.parse(result)).toEqual({ habits: [], date: '2026-06-17' });
        expect(identities).toHaveLength(1);
        expect(identities[0].properties.userId).toBe('user-1');
    });
});

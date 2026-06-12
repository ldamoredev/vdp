import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { TestDatabase } from '../../../../test/test-database';
import { TestApp } from './TestApp';
import { ALL_TEST_USERS, PRIMARY_TEST_USER, SECONDARY_TEST_USER, TEST_USER_ID_HEADER } from '../../../../test/testUsers';
import { localDateISO } from '../../../common/base/time/dates';

const testDb = new TestDatabase();
const testApp = new TestApp();

beforeAll(async () => {
    await testDb.setup();
    await testApp.setup();
}, 30_000);

beforeEach(async () => {
    await testDb.truncate({ users: ALL_TEST_USERS });
});

afterAll(async () => {
    await testApp.teardown();
});

function asUser(userId: string) {
    return { [TEST_USER_ID_HEADER]: userId };
}

function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return localDateISO(d);
}

async function createHabit(userId: string, name: string, emoji?: string) {
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/v1/health/habits',
        headers: asUser(userId),
        payload: { name, ...(emoji ? { emoji } : {}) },
    });
    return { status: response.statusCode, body: response.json() };
}

async function completeHabit(userId: string, habitId: string, date?: string) {
    const response = await testApp.app.inject({
        method: 'POST',
        url: `/api/v1/health/habits/${habitId}/complete`,
        headers: asUser(userId),
        payload: date ? { date } : {},
    });
    return { status: response.statusCode, body: response.json() };
}

async function listHabits(userId: string) {
    const response = await testApp.app.inject({
        method: 'GET',
        url: '/api/v1/health/habits',
        headers: asUser(userId),
    });
    return { status: response.statusCode, body: response.json() };
}

describe('Health API — E2E', () => {
    it('covers the habit daily loop: create, complete, uncomplete, archive', async () => {
        const created = await createHabit(PRIMARY_TEST_USER.id, 'Gimnasio', '🏋️');
        expect(created.status).toBe(201);
        expect(created.body).toMatchObject({
            name: 'Gimnasio',
            emoji: '🏋️',
            completedToday: false,
            streak: 0,
        });

        const habitId = created.body.id;

        const completed = await completeHabit(PRIMARY_TEST_USER.id, habitId);
        expect(completed.status).toBe(200);
        expect(completed.body).toEqual({ logged: true });

        // Idempotent re-complete
        const again = await completeHabit(PRIMARY_TEST_USER.id, habitId);
        expect(again.body).toEqual({ logged: false });

        let overview = await listHabits(PRIMARY_TEST_USER.id);
        expect(overview.status).toBe(200);
        expect(overview.body.habits[0]).toMatchObject({
            completedToday: true,
            streak: 1,
            totalCompletions: 1,
        });

        const uncompleted = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/health/habits/${habitId}/uncomplete`,
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: {},
        });
        expect(uncompleted.json()).toEqual({ removed: true });

        overview = await listHabits(PRIMARY_TEST_USER.id);
        expect(overview.body.habits[0]).toMatchObject({ completedToday: false, streak: 0 });

        const archived = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/health/habits/${habitId}/archive`,
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        expect(archived.statusCode).toBe(200);

        overview = await listHabits(PRIMARY_TEST_USER.id);
        expect(overview.body.habits).toHaveLength(0);
    });

    it('builds streaks across consecutive days, including backfill', async () => {
        const created = await createHabit(PRIMARY_TEST_USER.id, 'Leer');
        const habitId = created.body.id;

        await completeHabit(PRIMARY_TEST_USER.id, habitId, daysAgo(2));
        await completeHabit(PRIMARY_TEST_USER.id, habitId, daysAgo(1));
        await completeHabit(PRIMARY_TEST_USER.id, habitId);

        const overview = await listHabits(PRIMARY_TEST_USER.id);
        expect(overview.body.habits[0]).toMatchObject({
            completedToday: true,
            streak: 3,
            bestStreak: 3,
            totalCompletions: 3,
        });
    });

    it('rejects malformed and future dates', async () => {
        const created = await createHabit(PRIMARY_TEST_USER.id, 'Meditar');
        const habitId = created.body.id;

        const malformed = await completeHabit(PRIMARY_TEST_USER.id, habitId, '2026-13-40');
        expect(malformed.status).toBe(400);

        const future = await completeHabit(PRIMARY_TEST_USER.id, habitId, daysAgo(-1));
        expect(future.status).toBe(422);
    });

    it('isolates habits between users', async () => {
        const created = await createHabit(PRIMARY_TEST_USER.id, 'Privado');
        const habitId = created.body.id;

        const otherList = await listHabits(SECONDARY_TEST_USER.id);
        expect(otherList.body.habits).toHaveLength(0);

        const otherComplete = await completeHabit(SECONDARY_TEST_USER.id, habitId);
        expect(otherComplete.status).toBe(404);

        const otherArchive = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/health/habits/${habitId}/archive`,
            headers: asUser(SECONDARY_TEST_USER.id),
        });
        expect(otherArchive.statusCode).toBe(404);

        // Still intact for the owner
        const ownList = await listHabits(PRIMARY_TEST_USER.id);
        expect(ownList.body.habits).toHaveLength(1);
    });

    it('runs the cross-domain flow: broken streak creates a recovery task for the right user', async () => {
        const created = await createHabit(PRIMARY_TEST_USER.id, 'Gimnasio');
        const habitId = created.body.id;

        // A 3-day streak that died 4 days ago, resumed today.
        await completeHabit(PRIMARY_TEST_USER.id, habitId, daysAgo(6));
        await completeHabit(PRIMARY_TEST_USER.id, habitId, daysAgo(5));
        await completeHabit(PRIMARY_TEST_USER.id, habitId, daysAgo(4));
        await completeHabit(PRIMARY_TEST_USER.id, habitId);

        // The recovery task lands in the Tasks module, scheduled today. Task
        // creation is fire-and-forget inside the event handler, so poll briefly.
        let recovery: { title: string; domain: string; priority: number } | undefined;
        for (let attempt = 0; attempt < 20 && !recovery; attempt++) {
            const tasks = await testApp.app.inject({
                method: 'GET',
                url: `/api/v1/tasks?scheduledDate=${localDateISO(new Date())}`,
                headers: asUser(PRIMARY_TEST_USER.id),
            });
            recovery = tasks.json().tasks.find(
                (task: { title: string }) => task.title === 'Sostener hábito: Gimnasio',
            );
            if (!recovery) await new Promise((resolve) => setTimeout(resolve, 50));
        }
        expect(recovery).toBeDefined();
        expect(recovery!.domain).toBe('health');
        expect(recovery!.priority).toBe(2);

        // And the insight is visible through the tasks insights endpoint.
        const insights = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/tasks/insights?limit=10',
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        const broken = insights.json().insights.find(
            (insight: { title: string }) => insight.title.includes('Se cortó tu racha'),
        );
        expect(broken).toBeDefined();

        // The other user sees neither.
        const otherTasks = await testApp.app.inject({
            method: 'GET',
            url: `/api/v1/tasks?scheduledDate=${localDateISO(new Date())}`,
            headers: asUser(SECONDARY_TEST_USER.id),
        });
        expect(otherTasks.json().tasks).toHaveLength(0);
    });
});

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';

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

    it('covers the counter loop: create with past start, relapse, isolation', async () => {
        const created = await testApp.app.inject({
            method: 'POST',
            url: '/api/v1/health/counters',
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: { name: 'Sin fumar', dailyCost: '1000.00', startedAt: daysAgo(10) },
        });
        expect(created.statusCode).toBe(201);
        expect(created.json()).toMatchObject({
            name: 'Sin fumar',
            currentDays: 10,
            bestDays: 10,
            attemptCount: 1,
            moneyNotSpent: '10000.00',
        });
        const counterId = created.json().id;

        // Relapse closes the attempt and restarts today.
        const relapsed = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/health/counters/${counterId}/relapse`,
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: {},
        });
        expect(relapsed.statusCode).toBe(200);
        expect(relapsed.json()).toMatchObject({
            currentDays: 0,
            bestDays: 10,
            attemptCount: 2,
        });

        // Isolation: the other user sees nothing and cannot touch it.
        const otherList = await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/health/counters',
            headers: asUser(SECONDARY_TEST_USER.id),
        });
        expect(otherList.json().counters).toHaveLength(0);

        const otherRelapse = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/health/counters/${counterId}/relapse`,
            headers: asUser(SECONDARY_TEST_USER.id),
            payload: {},
        });
        expect(otherRelapse.statusCode).toBe(404);
    });

    it('emits a counter milestone as a tasks insight on overview load, exactly once', async () => {
        // Creation with a past start suppresses retroactive milestones, so a
        // fresh counter never fires on its first load...
        const created = await testApp.app.inject({
            method: 'POST',
            url: '/api/v1/health/counters',
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: { name: 'Sin alcohol', dailyCost: '500.00', startedAt: daysAgo(7) },
        });
        expect(created.statusCode).toBe(201);

        async function findMilestoneInsight() {
            const insights = await testApp.app.inject({
                method: 'GET',
                url: '/api/v1/tasks/insights?limit=20',
                headers: asUser(PRIMARY_TEST_USER.id),
            });
            return insights.json().insights.filter(
                (insight: { title: string }) => insight.title.includes('Sin alcohol'),
            );
        }

        await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/health/counters',
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        expect(await findMilestoneInsight()).toHaveLength(0);

        // ...then "time passes": reset the dedupe column to simulate the
        // milestone being crossed since the last notification.
        await testDb.query.execute(
            sql`UPDATE health.counters SET last_milestone_notified = 1 WHERE id = ${created.json().id}`,
        );

        await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/health/counters',
            headers: asUser(PRIMARY_TEST_USER.id),
        });

        const milestones = await findMilestoneInsight();
        expect(milestones).toHaveLength(1);
        expect(milestones[0].title).toBe('7 días de "Sin alcohol"');
        expect(milestones[0].message).toContain('$3500.00');

        // Loading again must not duplicate it.
        await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/health/counters',
            headers: asUser(PRIMARY_TEST_USER.id),
        });
        expect(await findMilestoneInsight()).toHaveLength(1);
    });

    it('covers the goal loop: create, deadline signal, graduate into a habit, isolation', async () => {
        function daysAhead(n: number): string {
            const d = new Date();
            d.setDate(d.getDate() + n);
            return localDateISO(d);
        }

        // Creation validations
        const past = await testApp.app.inject({
            method: 'POST',
            url: '/api/v1/health/goals',
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: { title: 'Mal', targetDate: daysAgo(1) },
        });
        expect(past.statusCode).toBe(422);

        // A goal due in 5 days: listing it should fire the t7 deadline signal.
        const created = await testApp.app.inject({
            method: 'POST',
            url: '/api/v1/health/goals',
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: { title: 'Empezar el gym', targetDate: daysAhead(5) },
        });
        expect(created.statusCode).toBe(201);
        expect(created.json()).toMatchObject({ status: 'active', daysLeft: 5 });
        const goalId = created.json().id;

        await testApp.app.inject({
            method: 'GET',
            url: '/api/v1/health/goals',
            headers: asUser(PRIMARY_TEST_USER.id),
        });

        // Decision task lands in Tasks (fire-and-forget: poll briefly).
        let decision: { title: string; priority: number } | undefined;
        for (let attempt = 0; attempt < 20 && !decision; attempt++) {
            const tasks = await testApp.app.inject({
                method: 'GET',
                url: `/api/v1/tasks?scheduledDate=${localDateISO(new Date())}`,
                headers: asUser(PRIMARY_TEST_USER.id),
            });
            decision = tasks.json().tasks.find(
                (task: { title: string }) => task.title === 'Decidir meta: Empezar el gym',
            );
            if (!decision) await new Promise((resolve) => setTimeout(resolve, 50));
        }
        expect(decision).toBeDefined();
        expect(decision!.priority).toBe(2);

        // Isolation
        const otherComplete = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/health/goals/${goalId}/complete`,
            headers: asUser(SECONDARY_TEST_USER.id),
        });
        expect(otherComplete.statusCode).toBe(404);

        // Graduation: completes the goal and creates the habit in one call.
        const graduated = await testApp.app.inject({
            method: 'POST',
            url: `/api/v1/health/goals/${goalId}/graduate`,
            headers: asUser(PRIMARY_TEST_USER.id),
            payload: { habitName: 'Gimnasio', emoji: '🏋️' },
        });
        expect(graduated.statusCode).toBe(200);
        expect(graduated.json().goal.status).toBe('done');
        expect(graduated.json().habit.name).toBe('Gimnasio');

        const habits = await listHabits(PRIMARY_TEST_USER.id);
        expect(habits.body.habits.map((h: { name: string }) => h.name)).toContain('Gimnasio');
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

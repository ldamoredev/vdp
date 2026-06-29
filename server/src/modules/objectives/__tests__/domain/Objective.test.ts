import { afterEach, describe, expect, it, vi } from 'vitest';

import { Objective } from '../../domain/Objective';

const baseSnapshot = {
    id: 'objective-1',
    ownerUserId: 'user-1',
    title: 'Facturar horas estratégicas',
    periodStart: '2026-07-01',
    periodEnd: '2026-09-30',
    metricSource: 'projects_hours',
    metricTargetId: null,
    target: 120,
    unit: 'h',
    manualValue: null,
    currency: null,
    status: 'active',
    archivedAt: null,
    achievedAt: null,
    createdAt: new Date('2026-06-28T10:00:00.000Z'),
    updatedAt: new Date('2026-06-28T10:00:00.000Z'),
} as const;

describe('Objective', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('round-trips immutable snapshots', () => {
        const objective = Objective.fromSnapshot(baseSnapshot);

        expect(objective.toSnapshot()).toEqual(baseSnapshot);
    });

    it('rejects periods whose end comes before the start', () => {
        expect(() =>
            Objective.fromSnapshot({
                ...baseSnapshot,
                periodStart: '2026-10-01',
                periodEnd: '2026-09-30',
            }),
        ).toThrow(/period/i);
    });

    it('updates editable fields and keeps lifecycle state active', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-28T12:00:00.000Z'));
        const objective = Objective.fromSnapshot(baseSnapshot);

        objective.update({
            title: 'Deep work anual',
            periodStart: '2026-01-01',
            periodEnd: '2026-12-31',
            metricSource: 'manual',
            metricTargetId: null,
            target: 50,
            unit: 'sesiones',
            manualValue: 7,
            currency: null,
        });

        expect(objective.toSnapshot()).toMatchObject({
            title: 'Deep work anual',
            periodStart: '2026-01-01',
            periodEnd: '2026-12-31',
            metricSource: 'manual',
            target: 50,
            unit: 'sesiones',
            manualValue: 7,
            currency: null,
            status: 'active',
            updatedAt: new Date('2026-06-28T12:00:00.000Z'),
        });
    });

    it('stores a target id for health habit completions and clears it for other metrics', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-28T12:00:00.000Z'));
        const objective = Objective.fromSnapshot({
            ...baseSnapshot,
            metricSource: 'health_habit_completions',
            metricTargetId: 'habit-1',
            unit: 'veces',
        });

        objective.update({ metricSource: 'manual', unit: 'puntos', manualValue: 3 });

        expect(objective.toSnapshot()).toMatchObject({
            metricSource: 'manual',
            metricTargetId: null,
            manualValue: 3,
            updatedAt: new Date('2026-06-28T12:00:00.000Z'),
        });
        expect(() => Objective.fromSnapshot({
            ...baseSnapshot,
            metricSource: 'health_habit_completions',
            unit: 'veces',
            metricTargetId: null,
        })).toThrow(/target/i);
    });

    it('stores currency for wallet savings and clears it for non-currency metrics', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-28T12:00:00.000Z'));
        const objective = Objective.fromSnapshot({
            ...baseSnapshot,
            metricSource: 'wallet_savings',
            unit: 'USD',
            currency: 'USD',
        });

        objective.update({ metricSource: 'tasks_completed', unit: 'tareas' });

        expect(objective.toSnapshot()).toMatchObject({
            metricSource: 'tasks_completed',
            unit: 'tareas',
            currency: null,
            updatedAt: new Date('2026-06-28T12:00:00.000Z'),
        });
        expect(() => Objective.fromSnapshot({
            ...baseSnapshot,
            metricSource: 'wallet_savings',
            unit: 'ARS',
            currency: null,
        })).toThrow(/currency/i);
    });

    it('marks achieved and archives with timestamps', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-28T12:00:00.000Z'));
        const achieved = Objective.fromSnapshot(baseSnapshot);
        const archived = Objective.fromSnapshot({ ...baseSnapshot, id: 'objective-2' });

        achieved.markAchieved();
        archived.archive();

        expect(achieved.toSnapshot()).toMatchObject({
            status: 'achieved',
            achievedAt: new Date('2026-06-28T12:00:00.000Z'),
            updatedAt: new Date('2026-06-28T12:00:00.000Z'),
        });
        expect(archived.toSnapshot()).toMatchObject({
            status: 'archived',
            archivedAt: new Date('2026-06-28T12:00:00.000Z'),
            updatedAt: new Date('2026-06-28T12:00:00.000Z'),
        });
    });

    it('does not mark archived objectives achieved', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-28T12:00:00.000Z'));
        const objective = Objective.fromSnapshot({
            ...baseSnapshot,
            status: 'archived',
            archivedAt: new Date('2026-06-28T11:00:00.000Z'),
        });

        objective.markAchieved();

        expect(objective.toSnapshot()).toMatchObject({
            status: 'archived',
            archivedAt: new Date('2026-06-28T11:00:00.000Z'),
            achievedAt: null,
            updatedAt: new Date('2026-06-28T10:00:00.000Z'),
        });
    });
});

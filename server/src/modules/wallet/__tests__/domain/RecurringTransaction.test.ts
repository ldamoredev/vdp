import { describe, it, expect } from 'vitest';

import { RecurringTransaction } from '../../domain/RecurringTransaction';

function rule(overrides: Partial<{
    dayOfMonth: number;
    startDate: string;
    endDate: string | null;
    lastRunDate: string | null;
}> = {}): RecurringTransaction {
    return RecurringTransaction.fromSnapshot({
        id: 'r1',
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: 'expense',
        amount: '50000',
        currency: 'ARS',
        description: 'Alquiler',
        dayOfMonth: overrides.dayOfMonth ?? 1,
        startDate: overrides.startDate ?? '2026-04-01',
        endDate: overrides.endDate ?? null,
        lastRunDate: overrides.lastRunDate ?? null,
        active: true,
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-01'),
    });
}

describe('RecurringTransaction.dueOccurrences', () => {
    it('lists every monthly occurrence from the start date up to today', () => {
        expect(rule({ dayOfMonth: 1, startDate: '2026-04-01' }).dueOccurrences('2026-06-17'))
            .toEqual(['2026-04-01', '2026-05-01', '2026-06-01']);
    });

    it('only returns occurrences after the last run', () => {
        expect(rule({ dayOfMonth: 1, lastRunDate: '2026-05-01' }).dueOccurrences('2026-06-17'))
            .toEqual(['2026-06-01']);
    });

    it('clamps the day to the last day of short months', () => {
        expect(rule({ dayOfMonth: 31, startDate: '2026-01-31' }).dueOccurrences('2026-03-15'))
            .toEqual(['2026-01-31', '2026-02-28']);
    });

    it('stops at the end date', () => {
        expect(rule({ dayOfMonth: 1, startDate: '2026-04-01', endDate: '2026-05-01' }).dueOccurrences('2026-08-01'))
            .toEqual(['2026-04-01', '2026-05-01']);
    });

    it('returns nothing when today is before the first occurrence', () => {
        expect(rule({ dayOfMonth: 10, startDate: '2026-06-10' }).dueOccurrences('2026-06-05')).toEqual([]);
    });

    it('returns nothing when nothing new is due since the last run', () => {
        expect(rule({ dayOfMonth: 1, lastRunDate: '2026-06-01' }).dueOccurrences('2026-06-17')).toEqual([]);
    });
});

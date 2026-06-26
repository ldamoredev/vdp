import { describe, expect, it, vi } from 'vitest';

import { TimeEntry } from '../../domain/TimeEntry';

describe('TimeEntry', () => {
    it('updates logged project time', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 18, 9, 0, 0));
        const entry = TimeEntry.fromSnapshot({
            id: 'entry-1',
            projectId: 'project-1',
            taskId: null,
            date: '2026-06-17',
            minutes: 45,
            note: 'Initial planning',
            createdAt: new Date(2026, 5, 17, 9, 0, 0),
            updatedAt: new Date(2026, 5, 17, 9, 0, 0),
        });

        entry.update({
            taskId: 'task-1',
            date: '2026-06-18',
            minutes: 75,
            note: null,
        });

        expect(entry.toSnapshot()).toMatchObject({
            taskId: 'task-1',
            date: '2026-06-18',
            minutes: 75,
            note: null,
            updatedAt: new Date(2026, 5, 18, 9, 0, 0),
        });
        vi.useRealTimers();
    });

    it('rejects non-positive minutes', () => {
        expect(() => TimeEntry.fromSnapshot({
            id: 'entry-1',
            projectId: 'project-1',
            taskId: null,
            date: '2026-06-17',
            minutes: 0,
            note: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })).toThrow('Time entry minutes must be positive');
    });
});

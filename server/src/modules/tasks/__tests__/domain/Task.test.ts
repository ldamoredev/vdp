import { describe, it, expect } from 'vitest';
import { Task } from '../../domain/Task';
import { createTask } from '../fakes/task-factory';

describe('Task Entity', () => {
    describe('complete()', () => {
        it('sets status to "done" and assigns completedAt', () => {
            const task = createTask({ status: 'pending' });
            const before = task.updatedAt;

            task.complete();

            expect(task.status).toBe('done');
            expect(task.completedAt).toBeInstanceOf(Date);
            expect(task.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        });
    });

    describe('carryOver()', () => {
        it('updates scheduledDate and increments carryOverCount', () => {
            const task = createTask({ carryOverCount: 1, scheduledDate: '2026-03-18' });

            task.carryOver('2026-03-19');

            expect(task.status).toBe('pending');
            expect(task.scheduledDate).toBe('2026-03-19');
            expect(task.carryOverCount).toBe(2);
        });
    });

    describe('discard()', () => {
        it('sets status to "discarded"', () => {
            const task = createTask({ status: 'pending' });

            task.discard();

            expect(task.status).toBe('discarded');
        });
    });

    describe('isStuck()', () => {
        it('returns false when carryOverCount < 3', () => {
            expect(createTask({ carryOverCount: 2 }).isStuck()).toBe(false);
        });

        it('returns true when carryOverCount >= 3', () => {
            expect(createTask({ carryOverCount: 3 }).isStuck()).toBe(true);
            expect(createTask({ carryOverCount: 5 }).isStuck()).toBe(true);
        });
    });

    describe('toSnapshot() / fromSnapshot()', () => {
        it('roundtrip preserves all fields', () => {
            const original = createTask({
                title: 'Test roundtrip',
                description: 'Some description',
                priority: 1,
                domain: 'work',
                carryOverCount: 2,
            });

            const restored = Task.fromSnapshot(original.toSnapshot());

            expect(restored.id).toBe(original.id);
            expect(restored.title).toBe(original.title);
            expect(restored.description).toBe(original.description);
            expect(restored.status).toBe(original.status);
            expect(restored.priority).toBe(original.priority);
            expect(restored.scheduledDate).toBe(original.scheduledDate);
            expect(restored.domain).toBe(original.domain);
            expect(restored.carryOverCount).toBe(original.carryOverCount);
            expect(restored.createdAt.getTime()).toBe(original.createdAt.getTime());
            expect(restored.updatedAt.getTime()).toBe(original.updatedAt.getTime());
        });

        it('restored entity retains methods', () => {
            const snapshot = createTask().toSnapshot();
            const restored = Task.fromSnapshot(snapshot);

            restored.complete();
            expect(restored.status).toBe('done');
        });
    });
});

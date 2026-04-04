import { describe, it, expect, beforeEach } from 'vitest';
import { GetTask } from '../../services/GetTask';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { FakeTaskNoteRepository } from '../fakes/FakeTaskNoteRepository';
import { createTask } from '../fakes/task-factory';

describe('GetTask', () => {
    const userId = 'test-user-id';
    let repo: FakeTaskRepository;
    let noteRepo: FakeTaskNoteRepository;
    let service: GetTask;

    beforeEach(() => {
        repo = new FakeTaskRepository();
        noteRepo = new FakeTaskNoteRepository();
        service = new GetTask(repo, noteRepo);
    });

    describe('execute()', () => {
        it('returns null when task does not exist', async () => {
            const result = await service.execute(userId, 'nonexistent');
            expect(result).toBeNull();
        });

        it('returns the task when it exists', async () => {
            const task = createTask({ title: 'Find me' });
            repo.seed([task]);

            const result = await service.execute(userId, task.id);
            expect(result).not.toBeNull();
            expect(result!.title).toBe('Find me');
        });
    });

    describe('executeWithNotes()', () => {
        it('returns null when task does not exist', async () => {
            const result = await service.executeWithNotes(userId, 'nonexistent');
            expect(result).toBeNull();
        });

        it('returns task with its notes', async () => {
            const task = createTask({ title: 'With notes' });
            repo.seed([task]);
            await noteRepo.addNote(userId, task.id, 'Note 1');
            await noteRepo.addNote(userId, task.id, 'Note 2');

            const result = await service.executeWithNotes(userId, task.id);

            expect(result).not.toBeNull();
            expect(result!.task.title).toBe('With notes');
            expect(result!.notes).toHaveLength(2);
            expect(result!.notes[0].content).toBe('Note 1');
        });

        it('returns empty notes array when task has no notes', async () => {
            const task = createTask();
            repo.seed([task]);

            const result = await service.executeWithNotes(userId, task.id);
            expect(result!.notes).toHaveLength(0);
        });
    });
});

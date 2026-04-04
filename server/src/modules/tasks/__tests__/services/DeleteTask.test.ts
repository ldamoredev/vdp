import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteTask } from '../../services/DeleteTask';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { FakeTaskNoteRepository } from '../fakes/FakeTaskNoteRepository';
import { createTask } from '../fakes/task-factory';

describe('DeleteTask', () => {
    const userId = 'test-user-id';
    let repo: FakeTaskRepository;
    let noteRepo: FakeTaskNoteRepository;
    let service: DeleteTask;

    beforeEach(() => {
        repo = new FakeTaskRepository();
        noteRepo = new FakeTaskNoteRepository();
        service = new DeleteTask(repo, noteRepo);
    });

    it('returns null when task does not exist', async () => {
        const result = await service.execute(userId, 'nonexistent');
        expect(result).toBeNull();
    });

    it('deletes the task and returns it', async () => {
        const task = createTask({ title: 'To delete' });
        repo.seed([task]);

        const result = await service.execute(userId, task.id);

        expect(result!.title).toBe('To delete');
        expect(repo.size).toBe(0);
    });

    it('deletes associated notes before the task', async () => {
        const task = createTask();
        repo.seed([task]);
        await noteRepo.addNote(userId, task.id, 'Note to delete');

        await service.execute(userId, task.id);

        const notes = await noteRepo.listNotes(userId, task.id);
        expect(notes).toHaveLength(0);
        expect(repo.size).toBe(0);
    });
});

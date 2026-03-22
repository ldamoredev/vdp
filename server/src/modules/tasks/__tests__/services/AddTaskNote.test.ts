import { describe, it, expect, beforeEach } from 'vitest';
import { AddTaskNote } from '../../services/AddTaskNote';
import { FakeTaskNoteRepository } from '../fakes/FakeTaskNoteRepository';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { createTask } from '../fakes/task-factory';

describe('AddTaskNote', () => {
    let taskRepo: FakeTaskRepository;
    let noteRepo: FakeTaskNoteRepository;
    let service: AddTaskNote;

    beforeEach(() => {
        taskRepo = new FakeTaskRepository();
        noteRepo = new FakeTaskNoteRepository();
        service = new AddTaskNote(taskRepo, noteRepo);
    });

    it('creates a note and returns it', async () => {
        const task = createTask({ id: 'task-1' });
        await taskRepo.save(task);

        const note = await service.execute('task-1', 'My note content');

        expect(note.taskId).toBe('task-1');
        expect(note.content).toBe('My note content');
        expect(note.type).toBe('note');
        expect(note.id).toBeDefined();
        expect(note.createdAt).toBeInstanceOf(Date);
    });

    it('supports typed notes for breakdown and blockers', async () => {
        const task = createTask({ id: 'task-1' });
        await taskRepo.save(task);

        const note = await service.execute('task-1', 'Definir entregable', 'breakdown_step');

        expect(note.type).toBe('breakdown_step');
    });

    it('persists the note in the repository', async () => {
        const task = createTask({ id: 'task-1' });
        await taskRepo.save(task);

        await service.execute('task-1', 'First note');
        await service.execute('task-1', 'Second note', 'blocker');

        const notes = await noteRepo.listNotes('task-1');
        expect(notes).toHaveLength(2);
        expect(notes[1].type).toBe('blocker');
    });

    it('throws when the task does not exist', async () => {
        await expect(service.execute('missing-task', 'First note')).rejects.toThrow('Task not found');
    });
});

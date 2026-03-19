import { describe, it, expect, beforeEach } from 'vitest';
import { DrizzleTaskRepository } from '../../infraestructure/db/DrizzleTaskRepository';
import { DrizzleTaskNoteRepository } from '../../infraestructure/db/DrizzleTaskNoteRepository';
import { testDb } from './test-database';

const taskRepo = new DrizzleTaskRepository(testDb as any);
const noteRepo = new DrizzleTaskNoteRepository(testDb as any);

beforeEach(async () => {
    await testDb.truncate();
});

describe('DrizzleTaskNoteRepository', () => {
    it('adds a note and returns it with id and timestamp', async () => {
        const task = await taskRepo.createTask({ title: 'Parent task' });
        const note = await noteRepo.addNote(task.id, 'My note');

        expect(note.id).toBeDefined();
        expect(note.taskId).toBe(task.id);
        expect(note.content).toBe('My note');
        expect(note.createdAt).toBeInstanceOf(Date);
    });

    it('lists notes ordered by createdAt', async () => {
        const task = await taskRepo.createTask({ title: 'Parent' });
        await noteRepo.addNote(task.id, 'First');
        await noteRepo.addNote(task.id, 'Second');
        await noteRepo.addNote(task.id, 'Third');

        const notes = await noteRepo.listNotes(task.id);

        expect(notes).toHaveLength(3);
        expect(notes[0].content).toBe('First');
        expect(notes[2].content).toBe('Third');
    });

    it('returns empty array when task has no notes', async () => {
        const task = await taskRepo.createTask({ title: 'No notes' });
        const notes = await noteRepo.listNotes(task.id);
        expect(notes).toHaveLength(0);
    });

    it('deletes all notes for a task', async () => {
        const task = await taskRepo.createTask({ title: 'Parent' });
        await noteRepo.addNote(task.id, 'Note 1');
        await noteRepo.addNote(task.id, 'Note 2');

        await noteRepo.deleteByTaskId(task.id);

        const notes = await noteRepo.listNotes(task.id);
        expect(notes).toHaveLength(0);
    });

    it('does not affect notes of other tasks', async () => {
        const task1 = await taskRepo.createTask({ title: 'Task 1' });
        const task2 = await taskRepo.createTask({ title: 'Task 2' });

        await noteRepo.addNote(task1.id, 'Note for task 1');
        await noteRepo.addNote(task2.id, 'Note for task 2');

        await noteRepo.deleteByTaskId(task1.id);

        const notes1 = await noteRepo.listNotes(task1.id);
        const notes2 = await noteRepo.listNotes(task2.id);

        expect(notes1).toHaveLength(0);
        expect(notes2).toHaveLength(1);
    });
});

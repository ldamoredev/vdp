import { describe, it, expect, beforeEach } from 'vitest';
import { DrizzleTaskRepository } from '../../infrastructure/db/DrizzleTaskRepository';
import { DrizzleTaskNoteRepository } from '../../infrastructure/db/DrizzleTaskNoteRepository';
import { testDb } from './test-database';

const taskRepo = new DrizzleTaskRepository(testDb as any);
const noteRepo = new DrizzleTaskNoteRepository(testDb as any);

beforeEach(async () => {
    await testDb.truncate();
});

const userId = '00000000-0000-0000-0000-000000000001';

describe('DrizzleTaskNoteRepository', () => {
    it('adds a note and returns it with id and timestamp', async () => {
        const task = await taskRepo.createTask(userId, { title: 'Parent task' });
        const note = await noteRepo.addNote(userId,task.id, 'My note', 'breakdown_step');

        expect(note.id).toBeDefined();
        expect(note.taskId).toBe(task.id);
        expect(note.content).toBe('My note');
        expect(note.type).toBe('breakdown_step');
        expect(note.createdAt).toBeInstanceOf(Date);
    });

    it('lists notes ordered by createdAt', async () => {
        const task = await taskRepo.createTask(userId, { title: 'Parent' });
        await noteRepo.addNote(userId,task.id, 'First');
        await noteRepo.addNote(userId,task.id, 'Second');
        await noteRepo.addNote(userId,task.id, 'Third');

        const notes = await noteRepo.listNotes(userId,task.id);

        expect(notes).toHaveLength(3);
        expect(notes[0].content).toBe('First');
        expect(notes[2].content).toBe('Third');
    });

    it('returns empty array when task has no notes', async () => {
        const task = await taskRepo.createTask(userId, { title: 'No notes' });
        const notes = await noteRepo.listNotes(userId,task.id);
        expect(notes).toHaveLength(0);
    });

    it('deletes all notes for a task', async () => {
        const task = await taskRepo.createTask(userId, { title: 'Parent' });
        await noteRepo.addNote(userId,task.id, 'Note 1');
        await noteRepo.addNote(userId,task.id, 'Note 2');

        await noteRepo.deleteByTaskId(userId,task.id);

        const notes = await noteRepo.listNotes(userId,task.id);
        expect(notes).toHaveLength(0);
    });

    it('does not affect notes of other tasks', async () => {
        const task1 = await taskRepo.createTask(userId, { title: 'Task 1' });
        const task2 = await taskRepo.createTask(userId, { title: 'Task 2' });

        await noteRepo.addNote(userId,task1.id, 'Note for task 1');
        await noteRepo.addNote(userId,task2.id, 'Note for task 2');

        await noteRepo.deleteByTaskId(userId,task1.id);

        const notes1 = await noteRepo.listNotes(userId,task1.id);
        const notes2 = await noteRepo.listNotes(userId,task2.id);

        expect(notes1).toHaveLength(0);
        expect(notes2).toHaveLength(1);
    });
});

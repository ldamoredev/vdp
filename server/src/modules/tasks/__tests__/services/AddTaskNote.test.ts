import { describe, it, expect, beforeEach } from 'vitest';
import { AddTaskNote } from '../../services/AddTaskNote';
import { FakeTaskNoteRepository } from '../fakes/FakeTaskNoteRepository';

describe('AddTaskNote', () => {
    let noteRepo: FakeTaskNoteRepository;
    let service: AddTaskNote;

    beforeEach(() => {
        noteRepo = new FakeTaskNoteRepository();
        service = new AddTaskNote(noteRepo);
    });

    it('creates a note and returns it', async () => {
        const note = await service.execute('task-1', 'My note content');

        expect(note.taskId).toBe('task-1');
        expect(note.content).toBe('My note content');
        expect(note.id).toBeDefined();
        expect(note.createdAt).toBeInstanceOf(Date);
    });

    it('persists the note in the repository', async () => {
        await service.execute('task-1', 'First note');
        await service.execute('task-1', 'Second note');

        const notes = await noteRepo.listNotes('task-1');
        expect(notes).toHaveLength(2);
    });
});

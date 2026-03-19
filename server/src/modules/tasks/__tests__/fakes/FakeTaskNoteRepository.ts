import { TaskNoteRepository, type TaskNote } from '../../domain/TaskNoteRepository';
import { randomUUID } from 'crypto';

export class FakeTaskNoteRepository extends TaskNoteRepository {
    private store = new Map<string, TaskNote[]>();

    async addNote(taskId: string, content: string): Promise<TaskNote> {
        const note: TaskNote = {
            id: randomUUID(),
            taskId,
            content,
            createdAt: new Date(),
        };
        const notes = this.store.get(taskId) ?? [];
        notes.push(note);
        this.store.set(taskId, notes);
        return note;
    }

    async listNotes(taskId: string): Promise<TaskNote[]> {
        return this.store.get(taskId) ?? [];
    }

    async deleteByTaskId(taskId: string): Promise<void> {
        this.store.delete(taskId);
    }

    clear(): void {
        this.store.clear();
    }
}

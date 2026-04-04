import { TaskNoteRepository, type TaskNote, type TaskNoteType } from '../../domain/TaskNoteRepository';
import { randomUUID } from 'crypto';

export class FakeTaskNoteRepository extends TaskNoteRepository {
    private store = new Map<string, TaskNote[]>();

    async addNote(_userId: string, taskId: string, content: string, type: TaskNoteType = 'note'): Promise<TaskNote> {
        const note: TaskNote = {
            id: randomUUID(),
            taskId,
            content,
            type,
            createdAt: new Date(),
        };
        const notes = this.store.get(taskId) ?? [];
        notes.push(note);
        this.store.set(taskId, notes);
        return note;
    }

    async listNotes(_userId: string, taskId: string): Promise<TaskNote[]> {
        return this.store.get(taskId) ?? [];
    }

    async deleteByTaskId(_userId: string, taskId: string): Promise<void> {
        this.store.delete(taskId);
    }

    clear(): void {
        this.store.clear();
    }
}

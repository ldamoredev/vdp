import { TaskNoteRepository, TaskNote, TaskNoteType } from '../../domain/TaskNoteRepository';
import { Database } from '../../../common/base/db/Database';
import { taskNotes } from './schema';
import { eq, asc } from 'drizzle-orm';

export class DrizzleTaskNoteRepository extends TaskNoteRepository {
    constructor(private db: Database) {
        super();
    }

    async addNote(taskId: string, content: string, type: TaskNoteType = 'note'): Promise<TaskNote> {
        const [note] = await this.db.query
            .insert(taskNotes)
            .values({ taskId, content, type })
            .returning();
        return toTaskNote(note);
    }

    async listNotes(taskId: string): Promise<TaskNote[]> {
        const notes = await this.db.query
            .select()
            .from(taskNotes)
            .where(eq(taskNotes.taskId, taskId))
            .orderBy(asc(taskNotes.createdAt));

        return notes.map(toTaskNote);
    }

    async deleteByTaskId(taskId: string): Promise<void> {
        await this.db.query.delete(taskNotes).where(eq(taskNotes.taskId, taskId));
    }
}

function toTaskNote(note: typeof taskNotes.$inferSelect): TaskNote {
    return {
        ...note,
        type: parseTaskNoteType(note.type),
    };
}

function parseTaskNoteType(type: string): TaskNoteType {
    if (type === 'note' || type === 'breakdown_step' || type === 'blocker') {
        return type;
    }

    return 'note';
}

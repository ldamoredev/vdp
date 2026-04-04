import { TaskNoteRepository, TaskNote, TaskNoteType } from '../../domain/TaskNoteRepository';
import { Database } from '../../../common/base/db/Database';
import { taskNotes, tasks } from './schema';
import { and, eq, asc } from 'drizzle-orm';

export class DrizzleTaskNoteRepository extends TaskNoteRepository {
    constructor(private db: Database) {
        super();
    }

    async addNote(userId: string, taskId: string, content: string, type: TaskNoteType = 'note'): Promise<TaskNote> {
        const [task] = await this.db.query
            .select({ id: tasks.id })
            .from(tasks)
            .where(and(eq(tasks.id, taskId), eq(tasks.ownerUserId, userId)))
            .limit(1);

        if (!task) {
            throw new Error('Task not found');
        }

        const [note] = await this.db.query
            .insert(taskNotes)
            .values({
                ownerUserId: userId,
                authorUserId: userId,
                taskId,
                content,
                type,
            })
            .returning();
        return toTaskNote(note);
    }

    async listNotes(userId: string, taskId: string): Promise<TaskNote[]> {
        const notes = await this.db.query
            .select()
            .from(taskNotes)
            .where(and(eq(taskNotes.taskId, taskId), eq(taskNotes.ownerUserId, userId)))
            .orderBy(asc(taskNotes.createdAt));

        return notes.map(toTaskNote);
    }

    async deleteByTaskId(userId: string, taskId: string): Promise<void> {
        await this.db.query
            .delete(taskNotes)
            .where(and(eq(taskNotes.taskId, taskId), eq(taskNotes.ownerUserId, userId)));
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

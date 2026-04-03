import { TaskNoteRepository, TaskNote, TaskNoteType } from '../../domain/TaskNoteRepository';
import { Database } from '../../../common/base/db/Database';
import { taskNotes, tasks } from './schema';
import { and, eq, asc } from 'drizzle-orm';
import { getScopedUserId } from '../../../common/http/request-auth';

export class DrizzleTaskNoteRepository extends TaskNoteRepository {
    constructor(private db: Database) {
        super();
    }

    async addNote(taskId: string, content: string, type: TaskNoteType = 'note'): Promise<TaskNote> {
        const ownerUserId = getScopedUserId();
        const [task] = await this.db.query
            .select({ id: tasks.id })
            .from(tasks)
            .where(and(eq(tasks.id, taskId), eq(tasks.ownerUserId, ownerUserId)))
            .limit(1);

        if (!task) {
            throw new Error('Task not found');
        }

        const [note] = await this.db.query
            .insert(taskNotes)
            .values({
                ownerUserId,
                authorUserId: ownerUserId,
                taskId,
                content,
                type,
            })
            .returning();
        return toTaskNote(note);
    }

    async listNotes(taskId: string): Promise<TaskNote[]> {
        const ownerUserId = getScopedUserId();
        const notes = await this.db.query
            .select()
            .from(taskNotes)
            .where(and(eq(taskNotes.taskId, taskId), eq(taskNotes.ownerUserId, ownerUserId)))
            .orderBy(asc(taskNotes.createdAt));

        return notes.map(toTaskNote);
    }

    async deleteByTaskId(taskId: string): Promise<void> {
        const ownerUserId = getScopedUserId();
        await this.db.query
            .delete(taskNotes)
            .where(and(eq(taskNotes.taskId, taskId), eq(taskNotes.ownerUserId, ownerUserId)));
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

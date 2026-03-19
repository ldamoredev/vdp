import { TaskNoteRepository, TaskNote } from '../../domain/TaskNoteRepository';
import { Database } from '../../../common/base/db/Database';
import { taskNotes } from './schema';
import { eq, asc } from 'drizzle-orm';

export class DrizzleTaskNoteRepository extends TaskNoteRepository {
    constructor(private db: Database) {
        super();
    }

    async addNote(taskId: string, content: string): Promise<TaskNote> {
        const [note] = await this.db.query
            .insert(taskNotes)
            .values({ taskId, content })
            .returning();
        return note;
    }

    async listNotes(taskId: string): Promise<TaskNote[]> {
        return this.db.query
            .select()
            .from(taskNotes)
            .where(eq(taskNotes.taskId, taskId))
            .orderBy(asc(taskNotes.createdAt));
    }

    async deleteByTaskId(taskId: string): Promise<void> {
        await this.db.query.delete(taskNotes).where(eq(taskNotes.taskId, taskId));
    }
}

import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Task } from '../domain/Task';
import { TaskNoteRepository } from '../domain/TaskNoteRepository';
import { TaskNote } from '../domain/TaskNoteRepository';
import { TaskRepository } from '../domain/TaskRepository';

export type TaskWithNotes = {
    task: Task;
    notes: TaskNote[];
};

export class GetTaskQuery extends Query<TaskWithNotes | null> {
    constructor(readonly id: string) {
        super();
    }
}

export class GetTaskQueryHandler implements RequestHandler<GetTaskQuery, TaskWithNotes | null> {
    constructor(
        private readonly tasks: TaskRepository,
        private readonly notes: TaskNoteRepository,
    ) {}

    async handle(query: GetTaskQuery, identity: Identity): Promise<TaskWithNotes | null> {
        const { userId } = requireUserIdentity(identity);
        const task = await this.tasks.getTask(userId, query.id);
        if (!task) return null;

        const notes = await this.notes.listNotes(userId, query.id);
        return { task, notes };
    }
}

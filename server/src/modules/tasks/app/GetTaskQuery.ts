import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { TaskNoteRepository } from '../domain/TaskNoteRepository';
import { TaskRepository } from '../domain/TaskRepository';
import { GetTask, TaskWithNotes } from '../services/GetTask';

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
        return new GetTask(this.tasks, this.notes).executeWithNotes(userId, query.id);
    }
}

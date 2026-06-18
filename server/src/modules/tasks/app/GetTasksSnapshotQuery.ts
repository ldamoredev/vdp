import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { TaskRepository } from '../domain/TaskRepository';
import { GetTasksSnapshot, TasksSnapshot } from '../services/GetTasksSnapshot';

export class GetTasksSnapshotQuery extends Query<TasksSnapshot> {}

export class GetTasksSnapshotQueryHandler implements RequestHandler<GetTasksSnapshotQuery, TasksSnapshot> {
    constructor(private readonly tasks: TaskRepository) {}

    async handle(_query: GetTasksSnapshotQuery, identity: Identity): Promise<TasksSnapshot> {
        const { userId } = requireUserIdentity(identity);
        return new GetTasksSnapshot(this.tasks).execute(userId);
    }
}

import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { TaskRepository, TaskFilters, PagedTasks } from '../domain/TaskRepository';
import { GetTasks } from '../services/GetTasks';

export class GetTasksQuery extends Query<PagedTasks> {
    constructor(readonly filters: TaskFilters = {}) {
        super();
    }
}

export class GetTasksQueryHandler implements RequestHandler<GetTasksQuery, PagedTasks> {
    constructor(private readonly tasks: TaskRepository) {}

    async handle(query: GetTasksQuery, identity: Identity): Promise<PagedTasks> {
        const { userId } = requireUserIdentity(identity);
        return new GetTasks(this.tasks).execute(userId, query.filters);
    }
}

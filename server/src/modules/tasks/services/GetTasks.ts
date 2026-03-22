import { TaskRepository } from '../domain/TaskRepository';
import { TaskStatus } from '../domain/Task';

export class GetTasks {
    constructor(private repository: TaskRepository) {
    }

    async execute(filters: Request) {
        return await this.repository.listTasks(filters);
    }
}

type Request = {
    scheduledDate?: string;
    status?: TaskStatus;
    domain?: string;
    priority?: number;
    limit?: number;
    offset?: number;
}

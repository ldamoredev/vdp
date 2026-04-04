import { TaskRepository } from '../domain/TaskRepository';
import { TaskStatus } from '../domain/Task';

export class GetTasks {
    constructor(private repository: TaskRepository) {
    }

    async execute(userId: string, filters: Request) {
        return await this.repository.listTasks(userId, filters);
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

import { TaskRepository } from '../domain/TaskRepository';

export class GetTasks {
    constructor(private repository: TaskRepository) {
    }

    async execute(filters: Request) {
        return await this.repository.listTasks(filters);
    }
}

type Request = {
    scheduledDate?: string;
    status?: string;
    domain?: string;
    priority?: number;
    limit?: number;
    offset?: number;
}
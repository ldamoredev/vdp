import { TaskRepository, DomainStat } from '../domain/TaskRepository';

export class GetCompletionByDomain {
    constructor(private repository: TaskRepository) {}

    async execute(userId: string, from?: string, to?: string): Promise<DomainStat[]> {
        return this.repository.getCompletionByDomain(userId, from, to);
    }
}

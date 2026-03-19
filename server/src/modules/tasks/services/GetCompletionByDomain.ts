import { TaskRepository, DomainStat } from '../domain/TaskRepository';

export class GetCompletionByDomain {
    constructor(private repository: TaskRepository) {}

    async execute(from?: string, to?: string): Promise<DomainStat[]> {
        return this.repository.getCompletionByDomain(from, to);
    }
}

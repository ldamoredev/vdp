import { UserRepository } from '../domain/UserRepository';

export class GetSetupStatus {
    constructor(private readonly users: UserRepository) {}

    async execute(): Promise<{ hasUsers: boolean }> {
        return { hasUsers: (await this.users.countUsers()) > 0 };
    }
}

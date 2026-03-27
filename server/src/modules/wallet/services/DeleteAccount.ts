import { Account } from '../domain/Account';
import { AccountRepository } from '../domain/AccountRepository';

export class DeleteAccount {
    constructor(private readonly accounts: AccountRepository) {}

    async execute(id: string): Promise<Account | null> {
        return this.accounts.delete(id);
    }
}

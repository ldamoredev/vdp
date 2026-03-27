import { Account, UpdateAccountData } from '../domain/Account';
import { AccountRepository } from '../domain/AccountRepository';

export class UpdateAccount {
    constructor(private readonly accounts: AccountRepository) {}

    async execute(id: string, data: UpdateAccountData): Promise<Account | null> {
        return this.accounts.update(id, data);
    }
}

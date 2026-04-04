import { Account, CreateAccountData } from '../domain/Account';
import { AccountRepository } from '../domain/AccountRepository';

export class CreateAccount {
    constructor(private readonly accounts: AccountRepository) {}

    async execute(userId: string, data: CreateAccountData): Promise<Account> {
        return this.accounts.create(userId, data);
    }
}

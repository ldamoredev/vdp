import { Account, CreateAccountData } from '../domain/Account';
import { AccountRepository } from '../domain/AccountRepository';

export class CreateAccount {
    constructor(private readonly accounts: AccountRepository) {}

    async execute(data: CreateAccountData): Promise<Account> {
        return this.accounts.create(data);
    }
}

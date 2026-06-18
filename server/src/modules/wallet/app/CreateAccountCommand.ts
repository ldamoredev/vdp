import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Account, CreateAccountData } from '../domain/Account';
import { AccountRepository } from '../domain/AccountRepository';
import { CreateAccount } from '../services/CreateAccount';

export class CreateAccountCommand extends Command<Account> {
    constructor(readonly input: CreateAccountData) {
        super();
    }
}

export class CreateAccountCommandHandler implements RequestHandler<CreateAccountCommand, Account> {
    constructor(private readonly accounts: AccountRepository) {}

    async handle(command: CreateAccountCommand, identity: Identity): Promise<Account> {
        const { userId } = requireUserIdentity(identity);
        return new CreateAccount(this.accounts).execute(userId, command.input);
    }
}

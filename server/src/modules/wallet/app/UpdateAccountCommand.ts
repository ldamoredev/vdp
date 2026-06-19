import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Account, UpdateAccountData } from '../domain/Account';
import { AccountRepository } from '../domain/AccountRepository';

export class UpdateAccountCommand extends Command<Account | null> {
    constructor(
        readonly accountId: string,
        readonly input: UpdateAccountData,
    ) {
        super();
    }
}

export class UpdateAccountCommandHandler implements RequestHandler<UpdateAccountCommand, Account | null> {
    constructor(private readonly accounts: AccountRepository) {}

    async handle(command: UpdateAccountCommand, identity: Identity): Promise<Account | null> {
        const { userId } = requireUserIdentity(identity);
        return this.accounts.update(userId, command.accountId, command.input);
    }
}

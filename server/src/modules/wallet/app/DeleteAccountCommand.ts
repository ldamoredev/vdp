import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Account } from '../domain/Account';
import { AccountRepository } from '../domain/AccountRepository';
import { DeleteAccount } from '../services/DeleteAccount';

export class DeleteAccountCommand extends Command<Account | null> {
    constructor(readonly accountId: string) {
        super();
    }
}

export class DeleteAccountCommandHandler implements RequestHandler<DeleteAccountCommand, Account | null> {
    constructor(private readonly accounts: AccountRepository) {}

    async handle(command: DeleteAccountCommand, identity: Identity): Promise<Account | null> {
        const { userId } = requireUserIdentity(identity);
        return new DeleteAccount(this.accounts).execute(userId, command.accountId);
    }
}

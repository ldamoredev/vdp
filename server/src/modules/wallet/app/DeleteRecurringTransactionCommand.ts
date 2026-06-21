import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { RecurringTransaction } from '../domain/RecurringTransaction';
import { RecurringTransactionRepository } from '../domain/RecurringTransactionRepository';

export class DeleteRecurringTransactionCommand extends Command<RecurringTransaction | null> {
    constructor(readonly id: string) {
        super();
    }
}

export class DeleteRecurringTransactionCommandHandler
    implements RequestHandler<DeleteRecurringTransactionCommand, RecurringTransaction | null>
{
    constructor(private readonly recurring: RecurringTransactionRepository) {}

    async handle(command: DeleteRecurringTransactionCommand, identity: Identity): Promise<RecurringTransaction | null> {
        const { userId } = requireUserIdentity(identity);
        return this.recurring.delete(userId, command.id);
    }
}

import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { todayISO } from '../../common/base/time/dates';
import { RecurringTransactionRepository } from '../domain/RecurringTransactionRepository';
import { TransactionRepository } from '../domain/TransactionRepository';
import { MaterializeRecurringTransactions } from '../services/MaterializeRecurringTransactions';

/** Returns how many transactions were materialized. Dispatched on wallet load. */
export class MaterializeDueRecurringTransactionsCommand extends Command<number> {}

export class MaterializeDueRecurringTransactionsCommandHandler
    implements RequestHandler<MaterializeDueRecurringTransactionsCommand, number>
{
    constructor(
        private readonly recurring: RecurringTransactionRepository,
        private readonly transactions: TransactionRepository,
    ) {}

    async handle(_command: MaterializeDueRecurringTransactionsCommand, identity: Identity): Promise<number> {
        const { userId } = requireUserIdentity(identity);
        return new MaterializeRecurringTransactions(this.recurring, this.transactions).execute(userId, todayISO());
    }
}

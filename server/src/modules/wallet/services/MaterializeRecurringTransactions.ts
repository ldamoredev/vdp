import { RecurringTransactionRepository } from '../domain/RecurringTransactionRepository';
import { TransactionRepository } from '../domain/TransactionRepository';

/**
 * Lazy materialization of recurring rules (D1c): turns due occurrences into real
 * transactions so stats and spike detection see the full picture. Triggered on
 * wallet load — there is no scheduler in the stack.
 *
 * Stats and spike detection read the transaction repository directly, so a
 * materialized transaction counts without re-emitting `wallet.transaction.created`
 * — and we deliberately skip that event to avoid firing spike checks over
 * back-filled historical months.
 */
export class MaterializeRecurringTransactions {
    constructor(
        private readonly recurring: RecurringTransactionRepository,
        private readonly transactions: TransactionRepository,
    ) {}

    async execute(userId: string, today: string): Promise<number> {
        const rules = await this.recurring.list(userId);
        let created = 0;

        for (const rule of rules) {
            if (!rule.active) continue;

            for (const date of rule.dueOccurrences(today)) {
                // Claim the occurrence atomically before creating: only the run
                // that wins the compare-and-swap creates the transaction, so
                // concurrent loads can never double-charge a recurring expense.
                const claimed = await this.recurring.advanceLastRunIfBefore(userId, rule.id, date);
                if (!claimed) continue;
                await this.transactions.create(userId, {
                    accountId: rule.accountId,
                    categoryId: rule.categoryId,
                    type: rule.type,
                    amount: rule.amount,
                    currency: rule.currency,
                    description: rule.description,
                    date,
                    tags: ['recurrente'],
                });
                created += 1;
            }
        }

        return created;
    }
}

import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { localDateISO } from '../../common/base/time/dates';
import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { TransactionRepository } from '../domain/TransactionRepository';

export type SpendingSummary = {
    readonly totalIncome: string;
    readonly totalExpenses: string;
    readonly netBalance: string;
    readonly transactionCount: number;
};

export class GetSpendingSummaryQuery extends Query<SpendingSummary> {
    constructor(
        readonly from?: string,
        readonly to?: string,
        readonly accountId?: string,
    ) {
        super();
    }
}

export class GetSpendingSummaryQueryHandler implements RequestHandler<GetSpendingSummaryQuery, SpendingSummary> {
    constructor(private readonly transactions: TransactionRepository) {}

    async handle(query: GetSpendingSummaryQuery, identity: Identity): Promise<SpendingSummary> {
        const { userId } = requireUserIdentity(identity);
        const now = new Date();
        const effectiveFrom = query.from ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const effectiveTo = query.to ?? localDateISO(now);

        const result = await this.transactions.list(userId, {
            from: effectiveFrom,
            to: effectiveTo,
            accountId: query.accountId,
            limit: 10000,
            offset: 0,
        });

        let totalIncome = 0;
        let totalExpenses = 0;

        for (const transaction of result.transactions) {
            const amount = Number.parseFloat(transaction.amount);
            if (transaction.type === 'income') {
                totalIncome += amount;
            } else if (transaction.type === 'expense') {
                totalExpenses += amount;
            }
        }

        return {
            totalIncome: totalIncome.toFixed(2),
            totalExpenses: totalExpenses.toFixed(2),
            netBalance: (totalIncome - totalExpenses).toFixed(2),
            transactionCount: result.total,
        };
    }
}

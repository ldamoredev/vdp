import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { TransactionRepository } from '../domain/TransactionRepository';

export type MonthlyTrendPoint = {
    readonly month: string;
    readonly income: number;
    readonly expense: number;
};

export class GetMonthlyTrendQuery extends Query<MonthlyTrendPoint[]> {
    constructor(readonly year?: number) {
        super();
    }
}

export class GetMonthlyTrendQueryHandler implements RequestHandler<GetMonthlyTrendQuery, MonthlyTrendPoint[]> {
    constructor(private readonly transactions: TransactionRepository) {}

    async handle(query: GetMonthlyTrendQuery, identity: Identity): Promise<MonthlyTrendPoint[]> {
        const { userId } = requireUserIdentity(identity);
        const effectiveYear = query.year ?? new Date().getFullYear();
        const result = await this.transactions.list(userId, {
            from: `${effectiveYear}-01-01`,
            to: `${effectiveYear}-12-31`,
            limit: 10000,
            offset: 0,
        });

        const months = new Map<string, { income: number; expense: number }>();
        for (const transaction of result.transactions) {
            const month = transaction.date.slice(0, 7);
            const existing = months.get(month) ?? { income: 0, expense: 0 };
            const amount = Number.parseFloat(transaction.amount);

            if (transaction.type === 'income') existing.income += amount;
            if (transaction.type === 'expense') existing.expense += amount;

            months.set(month, existing);
        }

        return Array.from(months.entries())
            .map(([month, totals]) => ({
                month,
                income: Number(totals.income.toFixed(2)),
                expense: Number(totals.expense.toFixed(2)),
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }
}

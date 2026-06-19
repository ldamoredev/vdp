import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { localDateISO } from '../../common/base/time/dates';
import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { CategoryRepository } from '../domain/CategoryRepository';
import { TransactionRepository } from '../domain/TransactionRepository';

export type CategoryStat = {
    readonly categoryId: string | null;
    readonly categoryName: string;
    readonly total: number;
    readonly count: number;
};

export class GetSpendingByCategoryQuery extends Query<CategoryStat[]> {
    constructor(
        readonly from?: string,
        readonly to?: string,
    ) {
        super();
    }
}

export class GetSpendingByCategoryQueryHandler implements RequestHandler<GetSpendingByCategoryQuery, CategoryStat[]> {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async handle(query: GetSpendingByCategoryQuery, identity: Identity): Promise<CategoryStat[]> {
        const { userId } = requireUserIdentity(identity);
        const now = new Date();
        const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const defaultTo = localDateISO(now);

        const result = await this.transactions.list(userId, {
            from: query.from ?? defaultFrom,
            to: query.to ?? defaultTo,
            type: 'expense',
            limit: 10000,
            offset: 0,
        });

        const categories = await this.categories.findAll(userId, 'expense');
        const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
        const totals = new Map<string | null, { total: number; count: number }>();

        for (const transaction of result.transactions) {
            const key = transaction.categoryId ?? null;
            const existing = totals.get(key) ?? { total: 0, count: 0 };
            existing.total += Number.parseFloat(transaction.amount);
            existing.count += 1;
            totals.set(key, existing);
        }

        return Array.from(totals.entries())
            .map(([categoryId, summary]) => ({
                categoryId,
                categoryName: categoryId ? (categoryNames.get(categoryId) ?? 'Sin categoria') : 'Sin categoria',
                total: Number(summary.total.toFixed(2)),
                count: summary.count,
            }))
            .sort((a, b) => b.total - a.total);
    }
}

import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { todayISO, weekStartISO } from '../../common/base/time/dates';
import { CategoryRepository } from '../domain/CategoryRepository';
import { TransactionRepository } from '../domain/TransactionRepository';
import { isFoodCategory } from '../services/food-category';

export type FoodSpendingByCurrency = {
    readonly currency: string;
    readonly total: number;
    readonly count: number;
};

/**
 * This week's eating-out / delivery spend, grouped by currency. Read-time
 * cross-domain context for an active weight/diet goal (D1b): "you have a weight
 * goal AND $X went to delivery this week". Currency-safe by construction — ARS
 * and USD are never summed into one number.
 */
export type FoodSpendingThisWeek = {
    readonly from: string;
    readonly to: string;
    readonly byCurrency: FoodSpendingByCurrency[];
};

export class GetFoodSpendingThisWeekQuery extends Query<FoodSpendingThisWeek> {}

export class GetFoodSpendingThisWeekQueryHandler
    implements RequestHandler<GetFoodSpendingThisWeekQuery, FoodSpendingThisWeek>
{
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async handle(_query: GetFoodSpendingThisWeekQuery, identity: Identity): Promise<FoodSpendingThisWeek> {
        const { userId } = requireUserIdentity(identity);
        const from = weekStartISO();
        const to = todayISO();

        const categories = await this.categories.findAll(userId, 'expense');
        const foodCategoryIds = new Set(categories.filter((c) => isFoodCategory(c.name)).map((c) => c.id));
        if (foodCategoryIds.size === 0) {
            return { from, to, byCurrency: [] };
        }

        const { transactions } = await this.transactions.list(userId, {
            from,
            to,
            type: 'expense',
            limit: 10000,
            offset: 0,
        });

        const byCurrency = new Map<string, { total: number; count: number }>();
        for (const tx of transactions) {
            if (!tx.categoryId || !foodCategoryIds.has(tx.categoryId)) continue;
            const bucket = byCurrency.get(tx.currency) ?? { total: 0, count: 0 };
            bucket.total += Number.parseFloat(tx.amount);
            bucket.count += 1;
            byCurrency.set(tx.currency, bucket);
        }

        return {
            from,
            to,
            byCurrency: Array.from(byCurrency.entries())
                .map(([currency, bucket]) => ({ currency, total: Number(bucket.total.toFixed(2)), count: bucket.count }))
                .sort((a, b) => b.total - a.total),
        };
    }
}

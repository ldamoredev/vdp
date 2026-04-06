import { Transaction, UpdateTransactionData } from '../domain/Transaction';
import { TransactionRepository } from '../domain/TransactionRepository';
import { AccountRepository } from '../domain/AccountRepository';
import { CategoryRepository } from '../domain/CategoryRepository';
import { NotFoundHttpError } from '../../common/http/errors';

export class UpdateTransaction {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly accounts: AccountRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async execute(userId: string, id: string, data: UpdateTransactionData): Promise<Transaction | null> {
        const existing = await this.transactions.findById(userId, id);
        if (!existing) return null;

        await this.assertOptionalAccountExists(userId, data.accountId, 'Account not found');
        await this.assertOptionalCategoryExists(userId, data.categoryId);
        await this.assertOptionalAccountExists(userId, data.transferToAccountId, 'Transfer account not found');

        return this.transactions.update(userId, id, data);
    }

    private async assertOptionalCategoryExists(userId: string, categoryId?: string | null): Promise<void> {
        if (!categoryId) return;

        const category = await this.categories.findById(userId, categoryId);
        if (!category) {
            throw new NotFoundHttpError('Category not found');
        }
    }

    private async assertOptionalAccountExists(userId: string, accountId?: string | null, message = 'Account not found'): Promise<void> {
        if (!accountId) return;

        const account = await this.accounts.findById(userId, accountId);
        if (!account) {
            throw new NotFoundHttpError(message);
        }
    }
}

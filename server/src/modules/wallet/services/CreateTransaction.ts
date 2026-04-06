import { Transaction, CreateTransactionData } from '../domain/Transaction';
import { TransactionRepository } from '../domain/TransactionRepository';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { TransactionCreated } from '../domain/events/TransactionCreated';
import { AccountRepository } from '../domain/AccountRepository';
import { CategoryRepository } from '../domain/CategoryRepository';
import { NotFoundHttpError } from '../../common/http/errors';

export class CreateTransaction {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly eventBus: EventBus,
        private readonly accounts: AccountRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async execute(userId: string, data: CreateTransactionData): Promise<Transaction> {
        await this.assertAccountExists(userId, data.accountId, 'Account not found');
        await this.assertOptionalCategoryExists(userId, data.categoryId);
        await this.assertOptionalAccountExists(userId, data.transferToAccountId, 'Transfer account not found');

        const tx = await this.transactions.create(userId, data);
        await this.eventBus.emit(
            new TransactionCreated({
                userId,
                transactionId: tx.id,
                type: tx.type,
                amount: tx.amount,
                currency: tx.currency,
                accountId: tx.accountId,
            }),
        );
        return tx;
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
        await this.assertAccountExists(userId, accountId, message);
    }

    private async assertAccountExists(userId: string, accountId: string, message: string): Promise<void> {
        const account = await this.accounts.findById(userId, accountId);
        if (!account) {
            throw new NotFoundHttpError(message);
        }
    }
}

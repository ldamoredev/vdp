import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { NotFoundHttpError } from '../../common/http/errors';
import { AccountRepository } from '../domain/AccountRepository';
import { CategoryRepository } from '../domain/CategoryRepository';
import { Transaction, UpdateTransactionData } from '../domain/Transaction';
import { TransactionRepository } from '../domain/TransactionRepository';

export class UpdateTransactionCommand extends Command<Transaction | null> {
    constructor(
        readonly transactionId: string,
        readonly input: UpdateTransactionData,
    ) {
        super();
    }
}

export class UpdateTransactionCommandHandler implements RequestHandler<UpdateTransactionCommand, Transaction | null> {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly accounts: AccountRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async handle(command: UpdateTransactionCommand, identity: Identity): Promise<Transaction | null> {
        const { userId } = requireUserIdentity(identity);
        const existing = await this.transactions.findById(userId, command.transactionId);
        if (!existing) return null;

        await this.assertOptionalAccountExists(userId, command.input.accountId, 'Account not found');
        await this.assertOptionalCategoryExists(userId, command.input.categoryId);
        await this.assertOptionalAccountExists(userId, command.input.transferToAccountId, 'Transfer account not found');

        return this.transactions.update(userId, command.transactionId, command.input);
    }

    private async assertOptionalCategoryExists(userId: string, categoryId?: string | null): Promise<void> {
        if (!categoryId) return;

        const category = await this.categories.findById(userId, categoryId);
        if (!category) {
            throw new NotFoundHttpError('Category not found');
        }
    }

    private async assertOptionalAccountExists(
        userId: string,
        accountId?: string | null,
        message = 'Account not found',
    ): Promise<void> {
        if (!accountId) return;

        const account = await this.accounts.findById(userId, accountId);
        if (!account) {
            throw new NotFoundHttpError(message);
        }
    }
}

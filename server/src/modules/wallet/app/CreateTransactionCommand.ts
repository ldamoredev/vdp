import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { NotFoundHttpError } from '../../common/http/errors';
import { AccountRepository } from '../domain/AccountRepository';
import { CategoryRepository } from '../domain/CategoryRepository';
import { TransactionCreated } from '../domain/events/TransactionCreated';
import { CreateTransactionData, Transaction } from '../domain/Transaction';
import { TransactionRepository } from '../domain/TransactionRepository';

export class CreateTransactionCommand extends Command<Transaction> {
    constructor(readonly input: CreateTransactionData) {
        super();
    }
}

export class CreateTransactionCommandHandler implements RequestHandler<CreateTransactionCommand, Transaction> {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly eventBus: EventBus,
        private readonly accounts: AccountRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async handle(command: CreateTransactionCommand, identity: Identity): Promise<Transaction> {
        const { userId } = requireUserIdentity(identity);
        await this.assertAccountExists(userId, command.input.accountId, 'Account not found');
        await this.assertOptionalCategoryExists(userId, command.input.categoryId);
        await this.assertOptionalAccountExists(userId, command.input.transferToAccountId, 'Transfer account not found');

        const transaction = await this.transactions.create(userId, command.input);
        await this.eventBus.emit(
            new TransactionCreated({
                userId,
                transactionId: transaction.id,
                type: transaction.type,
                amount: transaction.amount,
                currency: transaction.currency,
                accountId: transaction.accountId,
            }),
        );

        return transaction;
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
        await this.assertAccountExists(userId, accountId, message);
    }

    private async assertAccountExists(userId: string, accountId: string, message: string): Promise<void> {
        const account = await this.accounts.findById(userId, accountId);
        if (!account) {
            throw new NotFoundHttpError(message);
        }
    }
}

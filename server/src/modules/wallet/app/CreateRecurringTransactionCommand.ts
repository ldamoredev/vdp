import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { NotFoundHttpError } from '../../common/http/errors';
import { AccountRepository } from '../domain/AccountRepository';
import { CategoryRepository } from '../domain/CategoryRepository';
import { RecurringTransaction } from '../domain/RecurringTransaction';
import { CreateRecurringTransactionData, RecurringTransactionRepository } from '../domain/RecurringTransactionRepository';

export class CreateRecurringTransactionCommand extends Command<RecurringTransaction> {
    constructor(readonly input: CreateRecurringTransactionData) {
        super();
    }
}

export class CreateRecurringTransactionCommandHandler
    implements RequestHandler<CreateRecurringTransactionCommand, RecurringTransaction>
{
    constructor(
        private readonly recurring: RecurringTransactionRepository,
        private readonly accounts: AccountRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async handle(command: CreateRecurringTransactionCommand, identity: Identity): Promise<RecurringTransaction> {
        const { userId } = requireUserIdentity(identity);

        const account = await this.accounts.findById(userId, command.input.accountId);
        if (!account) throw new NotFoundHttpError('Account not found');

        if (command.input.categoryId) {
            const category = await this.categories.findById(userId, command.input.categoryId);
            if (!category) throw new NotFoundHttpError('Category not found');
        }

        return this.recurring.create(userId, command.input);
    }
}

import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { AccountRepository } from '../domain/AccountRepository';
import { CategoryRepository } from '../domain/CategoryRepository';
import { Transaction, UpdateTransactionData } from '../domain/Transaction';
import { TransactionRepository } from '../domain/TransactionRepository';
import { UpdateTransaction } from '../services/UpdateTransaction';

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
        return new UpdateTransaction(this.transactions, this.accounts, this.categories)
            .execute(userId, command.transactionId, command.input);
    }
}

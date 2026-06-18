import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { AccountRepository } from '../domain/AccountRepository';
import { CategoryRepository } from '../domain/CategoryRepository';
import { CreateTransactionData, Transaction } from '../domain/Transaction';
import { TransactionRepository } from '../domain/TransactionRepository';
import { CreateTransaction } from '../services/CreateTransaction';

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
        return new CreateTransaction(this.transactions, this.eventBus, this.accounts, this.categories)
            .execute(userId, command.input);
    }
}

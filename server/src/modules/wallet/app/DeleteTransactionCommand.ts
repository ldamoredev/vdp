import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Transaction } from '../domain/Transaction';
import { TransactionRepository } from '../domain/TransactionRepository';

export class DeleteTransactionCommand extends Command<Transaction | null> {
    constructor(readonly transactionId: string) {
        super();
    }
}

export class DeleteTransactionCommandHandler implements RequestHandler<DeleteTransactionCommand, Transaction | null> {
    constructor(private readonly transactions: TransactionRepository) {}

    async handle(command: DeleteTransactionCommand, identity: Identity): Promise<Transaction | null> {
        const { userId } = requireUserIdentity(identity);
        return this.transactions.delete(userId, command.transactionId);
    }
}

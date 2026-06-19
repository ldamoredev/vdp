import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { todayISO } from '../../common/base/time/dates';
import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { NotFoundHttpError } from '../../common/http/errors';
import { SavingsGoal } from '../domain/SavingsGoal';
import { SavingsGoalRepository } from '../domain/SavingsGoalRepository';
import { TransactionRepository } from '../domain/TransactionRepository';

export type ContributeSavingsCommandInput = {
    readonly goalId: string;
    readonly amount: string;
    readonly date?: string;
    readonly note?: string | null;
    readonly transactionId?: string | null;
};

export class ContributeSavingsCommand extends Command<SavingsGoal | null> {
    constructor(readonly input: ContributeSavingsCommandInput) {
        super();
    }
}

export class ContributeSavingsCommandHandler implements RequestHandler<ContributeSavingsCommand, SavingsGoal | null> {
    constructor(
        private readonly savingsGoals: SavingsGoalRepository,
        private readonly transactions: TransactionRepository,
    ) {}

    async handle(command: ContributeSavingsCommand, identity: Identity): Promise<SavingsGoal | null> {
        const { userId } = requireUserIdentity(identity);
        if (command.input.transactionId) {
            const transaction = await this.transactions.findById(userId, command.input.transactionId);
            if (!transaction) {
                throw new NotFoundHttpError('Transaction not found');
            }
        }

        return this.savingsGoals.contribute(userId, command.input.goalId, {
            amount: command.input.amount,
            date: command.input.date ?? todayISO(),
            note: command.input.note ?? null,
            transactionId: command.input.transactionId ?? null,
        });
    }
}

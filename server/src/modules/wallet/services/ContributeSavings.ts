import { todayISO } from '../../common/base/time/dates';
import { NotFoundHttpError } from '../../common/http/errors';
import { SavingsGoal } from '../domain/SavingsGoal';
import { SavingsGoalRepository } from '../domain/SavingsGoalRepository';
import { TransactionRepository } from '../domain/TransactionRepository';

export class ContributeSavings {
    constructor(
        private readonly goals: SavingsGoalRepository,
        private readonly transactions: TransactionRepository,
    ) {}

    async execute(userId: string, input: {
        goalId: string;
        amount: string;
        date?: string;
        note?: string | null;
        transactionId?: string | null;
    }): Promise<SavingsGoal | null> {
        if (input.transactionId) {
            const transaction = await this.transactions.findById(userId, input.transactionId);
            if (!transaction) {
                throw new NotFoundHttpError('Transaction not found');
            }
        }

        return this.goals.contribute(userId, input.goalId, {
            amount: input.amount,
            date: input.date ?? todayISO(),
            note: input.note ?? null,
            transactionId: input.transactionId ?? null,
        });
    }
}

import { todayISO } from '../../common/base/time/dates';
import { SavingsGoal } from '../domain/SavingsGoal';
import { SavingsGoalRepository } from '../domain/SavingsGoalRepository';

export class ContributeSavings {
    constructor(private readonly goals: SavingsGoalRepository) {}

    async execute(input: {
        goalId: string;
        amount: string;
        date?: string;
        note?: string | null;
        transactionId?: string | null;
    }): Promise<SavingsGoal | null> {
        return this.goals.contribute(input.goalId, {
            amount: input.amount,
            date: input.date ?? todayISO(),
            note: input.note ?? null,
            transactionId: input.transactionId ?? null,
        });
    }
}

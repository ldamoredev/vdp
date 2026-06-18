import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { SavingsGoal } from '../domain/SavingsGoal';
import { SavingsGoalRepository } from '../domain/SavingsGoalRepository';
import { TransactionRepository } from '../domain/TransactionRepository';
import { ContributeSavings } from '../services/ContributeSavings';

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
        return new ContributeSavings(this.savingsGoals, this.transactions).execute(userId, command.input);
    }
}

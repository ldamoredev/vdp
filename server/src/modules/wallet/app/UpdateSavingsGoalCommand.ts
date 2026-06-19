import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { SavingsGoal, UpdateSavingsGoalData } from '../domain/SavingsGoal';
import { SavingsGoalRepository } from '../domain/SavingsGoalRepository';

export class UpdateSavingsGoalCommand extends Command<SavingsGoal | null> {
    constructor(
        readonly savingsGoalId: string,
        readonly input: UpdateSavingsGoalData,
    ) {
        super();
    }
}

export class UpdateSavingsGoalCommandHandler implements RequestHandler<UpdateSavingsGoalCommand, SavingsGoal | null> {
    constructor(private readonly savingsGoals: SavingsGoalRepository) {}

    async handle(command: UpdateSavingsGoalCommand, identity: Identity): Promise<SavingsGoal | null> {
        const { userId } = requireUserIdentity(identity);
        return this.savingsGoals.update(userId, command.savingsGoalId, command.input);
    }
}

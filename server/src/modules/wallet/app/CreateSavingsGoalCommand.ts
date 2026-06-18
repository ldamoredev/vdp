import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { CreateSavingsGoalData, SavingsGoal } from '../domain/SavingsGoal';
import { SavingsGoalRepository } from '../domain/SavingsGoalRepository';
import { CreateSavingsGoal } from '../services/CreateSavingsGoal';

export class CreateSavingsGoalCommand extends Command<SavingsGoal> {
    constructor(readonly input: CreateSavingsGoalData) {
        super();
    }
}

export class CreateSavingsGoalCommandHandler implements RequestHandler<CreateSavingsGoalCommand, SavingsGoal> {
    constructor(private readonly savingsGoals: SavingsGoalRepository) {}

    async handle(command: CreateSavingsGoalCommand, identity: Identity): Promise<SavingsGoal> {
        const { userId } = requireUserIdentity(identity);
        return new CreateSavingsGoal(this.savingsGoals).execute(userId, command.input);
    }
}

import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { SavingsGoal } from '../domain/SavingsGoal';
import { SavingsGoalRepository } from '../domain/SavingsGoalRepository';
import { GetSavingsGoals } from '../services/GetSavingsGoals';

export class GetSavingsGoalsQuery extends Query<SavingsGoal[]> {}

export class GetSavingsGoalsQueryHandler implements RequestHandler<GetSavingsGoalsQuery, SavingsGoal[]> {
    constructor(private readonly savingsGoals: SavingsGoalRepository) {}

    async handle(_query: GetSavingsGoalsQuery, identity: Identity): Promise<SavingsGoal[]> {
        const { userId } = requireUserIdentity(identity);
        return new GetSavingsGoals(this.savingsGoals).execute(userId);
    }
}

import { DomainHttpError, NotFoundHttpError } from '../../common/http/errors';
import { Goal } from '../domain/Goal';
import { GoalRepository } from '../domain/GoalRepository';

export class DropGoal {
    constructor(private readonly goals: GoalRepository) {}

    async execute(userId: string, goalId: string): Promise<Goal> {
        const goal = await this.goals.getGoal(userId, goalId);
        if (!goal) throw new NotFoundHttpError('Goal not found');
        if (goal.status === 'dropped') return goal;
        if (goal.status === 'done') throw new DomainHttpError('Goal is already done');

        goal.drop();
        return this.goals.save(userId, goal);
    }
}

import { DomainHttpError, NotFoundHttpError } from '../../common/http/errors';
import { Goal } from '../domain/Goal';
import { GoalRepository } from '../domain/GoalRepository';

export class CompleteGoal {
    constructor(private readonly goals: GoalRepository) {}

    async execute(userId: string, goalId: string): Promise<Goal> {
        const goal = await this.goals.getGoal(userId, goalId);
        if (!goal) throw new NotFoundHttpError('Goal not found');
        if (goal.status === 'done') return goal;
        if (goal.status === 'dropped') throw new DomainHttpError('Goal was dropped');

        goal.complete();
        return this.goals.save(userId, goal);
    }
}

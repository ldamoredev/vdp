import { diffLocalDateISODays, todayISO } from '../../common/base/time/dates';
import { DomainHttpError } from '../../common/http/errors';
import { Goal } from '../domain/Goal';
import { CreateGoalData, GoalRepository } from '../domain/GoalRepository';

export class CreateGoal {
    constructor(private readonly goals: GoalRepository) {}

    async execute(userId: string, data: CreateGoalData): Promise<Goal> {
        if (diffLocalDateISODays(todayISO(), data.targetDate) < 1) {
            throw new DomainHttpError('Goal target date must be in the future');
        }

        return this.goals.createGoal(userId, {
            title: data.title,
            notes: data.notes ?? null,
            targetDate: data.targetDate,
        });
    }
}

import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';
import type { HabitCompletionsResponse } from '@vdp/shared';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { NotFoundHttpError } from '../../common/http/errors';
import { HabitRepository } from '../domain/HabitRepository';

export class GetHabitCompletionsQuery extends Query<HabitCompletionsResponse> {
    constructor(
        readonly habitId: string,
        readonly from: string,
        readonly to: string,
    ) {
        super();
    }
}

export class GetHabitCompletionsQueryHandler
implements RequestHandler<GetHabitCompletionsQuery, HabitCompletionsResponse> {
    constructor(private readonly habits: HabitRepository) {}

    async handle(query: GetHabitCompletionsQuery, identity: Identity): Promise<HabitCompletionsResponse> {
        const { userId } = requireUserIdentity(identity);
        const habit = await this.habits.getHabit(userId, query.habitId);
        if (!habit) throw new NotFoundHttpError('Habit not found');

        const dates = await this.habits.getCompletionDates(userId, query.habitId);
        return {
            habitId: query.habitId,
            from: query.from,
            to: query.to,
            count: dates.filter((date) => date >= query.from && date <= query.to).length,
        };
    }
}

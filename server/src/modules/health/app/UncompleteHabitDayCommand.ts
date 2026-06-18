import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { todayISO } from '../../common/base/time/dates';
import { NotFoundHttpError } from '../../common/http/errors';
import { HabitRepository } from '../domain/HabitRepository';

export class UncompleteHabitDayCommand extends Command<{ removed: boolean }> {
    constructor(
        readonly habitId: string,
        readonly date?: string,
    ) {
        super();
    }
}

export class UncompleteHabitDayCommandHandler implements RequestHandler<UncompleteHabitDayCommand, { removed: boolean }> {
    constructor(private readonly habits: HabitRepository) {}

    async handle(command: UncompleteHabitDayCommand, identity: Identity): Promise<{ removed: boolean }> {
        const { userId } = requireUserIdentity(identity);
        const habit = await this.habits.getHabit(userId, command.habitId);
        if (!habit) throw new NotFoundHttpError('Habit not found');

        const removed = await this.habits.removeCompletion(userId, command.habitId, command.date ?? todayISO());
        return { removed };
    }
}

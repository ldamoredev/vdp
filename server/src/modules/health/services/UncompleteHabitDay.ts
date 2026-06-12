import { todayISO } from '../../common/base/time/dates';
import { NotFoundHttpError } from '../../common/http/errors';
import { HabitRepository } from '../domain/HabitRepository';

export class UncompleteHabitDay {
    constructor(private readonly habits: HabitRepository) {}

    async execute(userId: string, habitId: string, date?: string): Promise<{ removed: boolean }> {
        const habit = await this.habits.getHabit(userId, habitId);
        if (!habit) throw new NotFoundHttpError('Habit not found');

        const removed = await this.habits.removeCompletion(userId, habitId, date ?? todayISO());
        return { removed };
    }
}

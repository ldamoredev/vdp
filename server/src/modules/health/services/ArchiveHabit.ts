import { NotFoundHttpError } from '../../common/http/errors';
import { Habit } from '../domain/Habit';
import { HabitRepository } from '../domain/HabitRepository';

export class ArchiveHabit {
    constructor(private readonly habits: HabitRepository) {}

    async execute(userId: string, habitId: string): Promise<Habit> {
        const habit = await this.habits.getHabit(userId, habitId);
        if (!habit) throw new NotFoundHttpError('Habit not found');
        if (habit.isArchived()) return habit;

        habit.archive();
        return this.habits.save(userId, habit);
    }
}

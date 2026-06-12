import { Habit } from '../domain/Habit';
import { CreateHabitData, HabitRepository } from '../domain/HabitRepository';

export class CreateHabit {
    constructor(private readonly habits: HabitRepository) {}

    async execute(userId: string, data: CreateHabitData): Promise<Habit> {
        return this.habits.createHabit(userId, {
            name: data.name,
            emoji: data.emoji ?? null,
        });
    }
}

import { Habit } from './Habit';

export type CreateHabitData = {
    readonly name: string;
    readonly emoji?: string | null;
};

export abstract class HabitRepository {
    abstract createHabit(userId: string, data: CreateHabitData): Promise<Habit>;
    abstract getHabit(userId: string, id: string): Promise<Habit | null>;
    abstract listHabits(userId: string, includeArchived?: boolean): Promise<Habit[]>;
    abstract save(userId: string, habit: Habit): Promise<Habit>;
    /** Idempotent: returns false when the (habit, date) log already exists. */
    abstract logCompletion(userId: string, habitId: string, date: string): Promise<boolean>;
    abstract removeCompletion(userId: string, habitId: string, date: string): Promise<boolean>;
    /** Completion dates for one habit, newest first, capped by `limit`. */
    abstract getCompletionDates(userId: string, habitId: string, limit?: number): Promise<string[]>;
}

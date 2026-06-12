import { randomUUID } from 'crypto';
import { Habit } from '../../domain/Habit';
import { CreateHabitData, HabitRepository } from '../../domain/HabitRepository';

type StoredHabit = {
    habit: Habit;
    userId: string;
};

export class FakeHabitRepository extends HabitRepository {
    private habits = new Map<string, StoredHabit>();
    private logs = new Map<string, Set<string>>(); // habitId -> dates

    // ─── Test helpers ──────────────────────────────────

    seedHabit(userId: string, habit: Habit): void {
        this.habits.set(habit.id, { habit, userId });
    }

    seedCompletions(habitId: string, dates: string[]): void {
        const set = this.logs.get(habitId) ?? new Set<string>();
        for (const date of dates) set.add(date);
        this.logs.set(habitId, set);
    }

    // ─── Repository ────────────────────────────────────

    async createHabit(userId: string, data: CreateHabitData): Promise<Habit> {
        const habit = new Habit(randomUUID(), data.name, data.emoji ?? null, null, new Date(), new Date());
        this.habits.set(habit.id, { habit, userId });
        return habit;
    }

    async getHabit(userId: string, id: string): Promise<Habit | null> {
        const stored = this.habits.get(id);
        return stored && stored.userId === userId ? stored.habit : null;
    }

    async listHabits(userId: string, includeArchived = false): Promise<Habit[]> {
        return Array.from(this.habits.values())
            .filter((stored) => stored.userId === userId)
            .filter((stored) => includeArchived || !stored.habit.isArchived())
            .map((stored) => stored.habit);
    }

    async save(userId: string, habit: Habit): Promise<Habit> {
        this.habits.set(habit.id, { habit, userId });
        return habit;
    }

    async logCompletion(userId: string, habitId: string, date: string): Promise<boolean> {
        const set = this.logs.get(habitId) ?? new Set<string>();
        if (set.has(date)) return false;
        set.add(date);
        this.logs.set(habitId, set);
        return true;
    }

    async removeCompletion(userId: string, habitId: string, date: string): Promise<boolean> {
        return this.logs.get(habitId)?.delete(date) ?? false;
    }

    async getCompletionDates(userId: string, habitId: string, limit = 400): Promise<string[]> {
        const stored = this.habits.get(habitId);
        if (!stored || stored.userId !== userId) return [];

        return Array.from(this.logs.get(habitId) ?? [])
            .sort((a, b) => b.localeCompare(a))
            .slice(0, limit);
    }
}

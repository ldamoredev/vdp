import { todayISO } from '../../common/base/time/dates';
import { Habit, HabitCadence } from '../domain/Habit';
import { HabitRepository } from '../domain/HabitRepository';
import { bestStreak, currentStreak, periodProgress } from './habit-streaks';

export type HabitOverviewRow = {
    readonly id: string;
    readonly name: string;
    readonly emoji: string | null;
    readonly cadence: HabitCadence;
    readonly weeklyTarget: number | null;
    readonly archivedAt: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly completedToday: boolean;
    readonly periodCompletions: number;
    readonly periodTarget: number;
    readonly streak: number;
    readonly bestStreak: number;
    readonly totalCompletions: number;
    readonly lastCompletedDate: string | null;
};

export type HabitsOverview = {
    readonly habits: HabitOverviewRow[];
    readonly date: string;
};

export class GetHabitsOverview {
    constructor(private readonly habits: HabitRepository) {}

    async execute(userId: string): Promise<HabitsOverview> {
        const today = todayISO();
        const activeHabits = await this.habits.listHabits(userId);

        const rows: HabitOverviewRow[] = [];
        for (const habit of activeHabits) {
            rows.push(await this.buildRow(userId, habit, today));
        }

        return { habits: rows, date: today };
    }

    async buildRow(userId: string, habit: Habit, today: string = todayISO()): Promise<HabitOverviewRow> {
        const dates = await this.habits.getCompletionDates(userId, habit.id);
        const cadence = habit.cadenceSpec();
        const progress = periodProgress(dates, today, cadence);

        return {
            ...habit.toSnapshot(),
            completedToday: dates[0] === today,
            periodCompletions: progress.completions,
            periodTarget: progress.target,
            streak: currentStreak(dates, today, cadence),
            bestStreak: bestStreak(dates, cadence),
            totalCompletions: dates.length,
            lastCompletedDate: dates[0] ?? null,
        };
    }
}

import {Identity, Query, RequestHandler} from '@nbottarini/cqbus';

import {UserIdentity} from '../../common/app/auth/UserIdentity';
import {todayISO} from "../../common/base/time/dates";
import {Habit} from "../domain/Habit";
import {bestStreak, currentStreak} from "../services/habit-streaks";
import {HabitRepository} from "../domain/HabitRepository";

export class GetHabitsOverviewQuery extends Query<HabitsOverview> {
}

export class GetHabitsOverviewQueryHandler implements RequestHandler<GetHabitsOverviewQuery, HabitsOverview> {
    constructor(private readonly habits: HabitRepository) {
    }

    async handle(_query: GetHabitsOverviewQuery, identity: Identity): Promise<HabitsOverview> {
        const userIdentity = identity as UserIdentity;
        const today = todayISO();
        const activeHabits = await this.habits.listHabits(userIdentity.userId);

        const rows: HabitOverviewRow[] = [];
        for (const habit of activeHabits) {
            rows.push(await this.buildRow(userIdentity.userId, habit, today));
        }

        return { habits: rows, date: today };
    }

    private async buildRow(userId: string, habit: Habit, today: string = todayISO()): Promise<HabitOverviewRow> {
        const dates = await this.habits.getCompletionDates(userId, habit.id);

        return {
            ...habit.toSnapshot(),
            completedToday: dates[0] === today,
            streak: currentStreak(dates, today),
            bestStreak: bestStreak(dates),
            totalCompletions: dates.length,
            lastCompletedDate: dates[0] ?? null,
        };
    }
}

export type HabitOverviewRow = {
    readonly id: string;
    readonly name: string;
    readonly emoji: string | null;
    readonly archivedAt: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly completedToday: boolean;
    readonly streak: number;
    readonly bestStreak: number;
    readonly totalCompletions: number;
    readonly lastCompletedDate: string | null;
};


export type HabitsOverview = {
    readonly habits: HabitOverviewRow[];
    readonly date: string;
};

import {Command, Identity, RequestHandler} from '@nbottarini/cqbus';

import {CreateHabitData, HabitRepository} from '../domain/HabitRepository';
import {requireUserIdentity} from "../../common/app/auth/UserIdentity";
import {Habit} from "../domain/Habit";
import {todayISO} from "../../common/base/time/dates";
import {bestStreak, currentStreak, periodProgress} from "../services/habit-streaks";
import {HabitOverviewRow} from "./GetHabitsOverviewQuery";
import {normalizeCreateHabitData} from "../services/CreateHabit";

export class CreateHabitCommand extends Command<HabitOverviewRow> {
    constructor(readonly input: CreateHabitData) {
        super();
    }
}

export class CreateHabitCommandHandler implements RequestHandler<CreateHabitCommand, HabitOverviewRow> {
    constructor(
        private readonly habits: HabitRepository,
    ) {}

    async handle(command: CreateHabitCommand, identity: Identity): Promise<HabitOverviewRow> {
        const {userId} = requireUserIdentity(identity);
        const habit = await this.habits.createHabit(userId, normalizeCreateHabitData(command.input));
        return this.buildRow(userId, habit);
    }

    private async buildRow(userId: string, habit: Habit, today: string = todayISO()): Promise<HabitOverviewRow> {
        const dates = await this.habits.getCompletionDates(userId, habit.id);
        const progress = periodProgress(dates, today, habit.cadenceSpec());

        return {
            ...habit.toSnapshot(),
            completedToday: dates[0] === today,
            periodCompletions: progress.completions,
            periodTarget: progress.target,
            streak: currentStreak(dates, today, habit.cadenceSpec()),
            bestStreak: bestStreak(dates, habit.cadenceSpec()),
            totalCompletions: dates.length,
            lastCompletedDate: dates[0] ?? null,
        };
    }
}

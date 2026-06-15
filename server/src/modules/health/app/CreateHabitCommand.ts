import {Command, Identity, RequestHandler} from '@nbottarini/cqbus';

import {CreateHabitData, HabitRepository} from '../domain/HabitRepository';
import {UserIdentity} from "../../common/app/auth/UserIdentity";
import {Habit} from "../domain/Habit";
import {todayISO} from "../../common/base/time/dates";
import {bestStreak, currentStreak} from "../services/habit-streaks";
import {HabitOverviewRow} from "./GetHabitsOverviewQuery";

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
        const userIdentity = identity as UserIdentity;
        const habit = await this.habits.createHabit(userIdentity.userId, {
            name: command.input.name,
            emoji: command.input.emoji ?? null,
        });
        return this.buildRow(userIdentity.userId, habit);
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

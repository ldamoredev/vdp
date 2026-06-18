import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { todayISO } from '../../common/base/time/dates';
import { DomainHttpError } from '../../common/http/errors';
import { Habit } from '../domain/Habit';
import { CreateHabitData, HabitRepository } from '../domain/HabitRepository';
import { bestStreak, currentStreak, periodProgress } from './habit-streaks';
import { HabitOverviewRow } from './GetHabitsOverviewQuery';

export class CreateHabitCommand extends Command<HabitOverviewRow> {
    constructor(readonly input: CreateHabitData) {
        super();
    }
}

export class CreateHabitCommandHandler implements RequestHandler<CreateHabitCommand, HabitOverviewRow> {
    constructor(private readonly habits: HabitRepository) {}

    async handle(command: CreateHabitCommand, identity: Identity): Promise<HabitOverviewRow> {
        const { userId } = requireUserIdentity(identity);
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

export function normalizeCreateHabitData(data: CreateHabitData): Required<CreateHabitData> {
    const cadence = data.cadence ?? 'daily';
    if (cadence === 'daily') {
        return {
            name: data.name,
            emoji: data.emoji ?? null,
            cadence: 'daily',
            weeklyTarget: null,
        };
    }

    if (cadence !== 'weekly') {
        throw new DomainHttpError('Invalid habit cadence');
    }

    const weeklyTarget = data.weeklyTarget;
    if (typeof weeklyTarget !== 'number' || !Number.isInteger(weeklyTarget) || weeklyTarget < 1 || weeklyTarget > 7) {
        throw new DomainHttpError('Weekly target must be between 1 and 7');
    }

    return {
        name: data.name,
        emoji: data.emoji ?? null,
        cadence: 'weekly',
        weeklyTarget,
    };
}

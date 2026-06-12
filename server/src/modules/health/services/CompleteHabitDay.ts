import { EventBus } from '../../common/base/event-bus/EventBus';
import { todayISO } from '../../common/base/time/dates';
import { diffLocalDateISODays } from '../../common/base/time/dates';
import { DomainHttpError, NotFoundHttpError } from '../../common/http/errors';
import { HabitRepository } from '../domain/HabitRepository';
import { HabitMilestone } from '../domain/events/HabitMilestone';
import { HabitStreakBroken } from '../domain/events/HabitStreakBroken';
import { runEndingAt } from './habit-streaks';

const MILESTONE_STREAKS = [7, 30, 100];
const MIN_STREAK_WORTH_MOURNING = 3;

export class CompleteHabitDay {
    constructor(
        private readonly habits: HabitRepository,
        private readonly eventBus: EventBus,
    ) {}

    async execute(userId: string, habitId: string, date?: string): Promise<{ logged: boolean }> {
        const targetDate = date ?? todayISO();
        const today = todayISO();

        if (diffLocalDateISODays(targetDate, today) < 0) {
            throw new DomainHttpError('Cannot complete a habit in the future');
        }

        const habit = await this.habits.getHabit(userId, habitId);
        if (!habit) throw new NotFoundHttpError('Habit not found');
        if (habit.isArchived()) throw new DomainHttpError('Habit is archived');

        const previousDates = await this.habits.getCompletionDates(userId, habitId);
        const logged = await this.habits.logCompletion(userId, habitId, targetDate);
        if (!logged) return { logged: false };

        // Signals only fire for live completions; backfills stay silent.
        if (targetDate === today) {
            this.emitSignals(userId, habit.id, habit.name, previousDates, targetDate);
        }

        return { logged: true };
    }

    private emitSignals(
        userId: string,
        habitId: string,
        habitName: string,
        previousDates: string[],
        date: string,
    ): void {
        const lastDate = previousDates[0];

        if (lastDate && diffLocalDateISODays(lastDate, date) > 1) {
            const lostStreak = runEndingAt(previousDates, lastDate);
            if (lostStreak >= MIN_STREAK_WORTH_MOURNING) {
                void this.eventBus.emit(new HabitStreakBroken({
                    userId,
                    habitId,
                    habitName,
                    lostStreak,
                    lastCompletedDate: lastDate,
                    resumedDate: date,
                }));
            }
        }

        const newStreak = runEndingAt([date, ...previousDates], date);
        if (MILESTONE_STREAKS.includes(newStreak)) {
            void this.eventBus.emit(new HabitMilestone({
                userId,
                habitId,
                habitName,
                streak: newStreak,
            }));
        }
    }
}

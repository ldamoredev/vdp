import { EventBus } from '../../common/base/event-bus/EventBus';
import { todayISO } from '../../common/base/time/dates';
import { diffLocalDateISODays } from '../../common/base/time/dates';
import { DomainHttpError, NotFoundHttpError } from '../../common/http/errors';
import { Habit } from '../domain/Habit';
import { HabitRepository } from '../domain/HabitRepository';
import { HabitMilestone } from '../domain/events/HabitMilestone';
import { HabitStreakBroken } from '../domain/events/HabitStreakBroken';
import { currentStreak, periodProgress, runEndingAt, weekStartISO } from './habit-streaks';

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
            this.emitSignals(userId, habit, previousDates, targetDate);
        }

        return { logged: true };
    }

    private emitSignals(
        userId: string,
        habit: Habit,
        previousDates: string[],
        date: string,
    ): void {
        if (habit.cadence === 'weekly') {
            this.emitWeeklySignals(userId, habit, previousDates, date);
            return;
        }

        const lastDate = previousDates[0];

        if (lastDate && diffLocalDateISODays(lastDate, date) > 1) {
            const lostStreak = runEndingAt(previousDates, lastDate);
            if (lostStreak >= MIN_STREAK_WORTH_MOURNING) {
                void this.eventBus.emit(new HabitStreakBroken({
                    userId,
                    habitId: habit.id,
                    habitName: habit.name,
                    lostStreak,
                    streakUnit: 'day',
                    lastCompletedDate: lastDate,
                    resumedDate: date,
                }));
            }
        }

        const newStreak = runEndingAt([date, ...previousDates], date);
        if (MILESTONE_STREAKS.includes(newStreak)) {
            void this.eventBus.emit(new HabitMilestone({
                userId,
                habitId: habit.id,
                habitName: habit.name,
                streak: newStreak,
                streakUnit: 'day',
            }));
        }
    }

    private emitWeeklySignals(
        userId: string,
        habit: Habit,
        previousDates: string[],
        date: string,
    ): void {
        const cadence = habit.cadenceSpec();
        if (cadence.cadence !== 'weekly') return;

        const latestMetWeek = this.latestMetWeek(previousDates, cadence.weeklyTarget);
        const currentWeek = weekStartISO(date);
        if (latestMetWeek && diffLocalDateISODays(latestMetWeek.weekStart, currentWeek) > 7
            && latestMetWeek.streak >= MIN_STREAK_WORTH_MOURNING) {
            void this.eventBus.emit(new HabitStreakBroken({
                userId,
                habitId: habit.id,
                habitName: habit.name,
                lostStreak: latestMetWeek.streak,
                streakUnit: 'week',
                lastCompletedDate: latestMetWeek.lastCompletedDate,
                resumedDate: date,
            }));
        }

        const before = periodProgress(previousDates, date, cadence);
        const afterDates = [date, ...previousDates];
        const after = periodProgress(afterDates, date, cadence);
        if (before.completions >= before.target || after.completions < after.target) return;

        const newStreak = currentStreak(afterDates, date, cadence);
        if (MILESTONE_STREAKS.includes(newStreak)) {
            void this.eventBus.emit(new HabitMilestone({
                userId,
                habitId: habit.id,
                habitName: habit.name,
                streak: newStreak,
                streakUnit: 'week',
            }));
        }
    }

    private latestMetWeek(
        datesDesc: readonly string[],
        target: number,
    ): { weekStart: string; lastCompletedDate: string; streak: number } | null {
        const weekCounts = new Map<string, number>();
        const weekLastDates = new Map<string, string>();

        for (const date of datesDesc) {
            const weekStart = weekStartISO(date);
            weekCounts.set(weekStart, (weekCounts.get(weekStart) ?? 0) + 1);
            if (!weekLastDates.has(weekStart)) weekLastDates.set(weekStart, date);
        }

        const weekStart = Array.from(weekCounts.entries())
            .filter(([, completions]) => completions >= target)
            .map(([week]) => week)
            .sort((left, right) => right.localeCompare(left))[0];

        if (!weekStart) return null;
        const lastCompletedDate = weekLastDates.get(weekStart)!;
        return {
            weekStart,
            lastCompletedDate,
            streak: runEndingAt(datesDesc, lastCompletedDate, { cadence: 'weekly', weeklyTarget: target }),
        };
    }
}

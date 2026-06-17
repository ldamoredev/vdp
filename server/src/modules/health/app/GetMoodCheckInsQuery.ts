import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';
import { MoodCheckInsResponse } from '@vdp/shared';

import { localDateISO, parseLocalDateISO, todayISO } from '../../common/base/time/dates';
import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { HabitRepository } from '../domain/HabitRepository';
import { MoodCheckInRepository } from '../domain/MoodCheckInRepository';
import { serializeMoodCheckIn } from './SaveMoodCheckInCommand';

const DEFAULT_DAYS = 7;

export class GetMoodCheckInsQuery extends Query<MoodCheckInsResponse> {
    constructor(readonly days: number = DEFAULT_DAYS) {
        super();
    }
}

export class GetMoodCheckInsQueryHandler implements RequestHandler<GetMoodCheckInsQuery, MoodCheckInsResponse> {
    constructor(
        private readonly checkIns: MoodCheckInRepository,
        private readonly habits: HabitRepository,
    ) {}

    async handle(query: GetMoodCheckInsQuery, identity: Identity): Promise<MoodCheckInsResponse> {
        const { userId } = requireUserIdentity(identity);
        const days = query.days ?? DEFAULT_DAYS;
        const today = todayISO();
        const fromDate = windowStart(days, today);
        const checkIns = await this.checkIns.listMoodCheckIns(userId, fromDate, today);
        const habitCompletionRate = await this.habitCompletionRate(userId, fromDate, today, days);

        return {
            checkIns: checkIns.map(serializeMoodCheckIn),
            date: today,
            summary: {
                days,
                checkInCount: checkIns.length,
                averageMood: average(checkIns.map((checkIn) => checkIn.mood)),
                averageEnergy: average(checkIns.map((checkIn) => checkIn.energy)),
                habitCompletionRate,
            },
        };
    }

    private async habitCompletionRate(userId: string, fromDate: string, today: string, days: number): Promise<number> {
        const habits = await this.habits.listHabits(userId);
        if (habits.length === 0) return 0;

        let expected = 0;
        let completed = 0;
        for (const habit of habits) {
            const cadence = habit.cadenceSpec();
            expected += cadence.cadence === 'weekly' ? (cadence.weeklyTarget ?? 1) : days;
            const dates = await this.habits.getCompletionDates(userId, habit.id);
            completed += dates.filter((date) => date >= fromDate && date <= today).length;
        }

        if (expected === 0) return 0;
        return Math.min(100, Math.round((completed / expected) * 100));
    }
}

function windowStart(days: number, today: string): string {
    const d = parseLocalDateISO(today);
    d.setDate(d.getDate() - (days - 1));
    return localDateISO(d);
}

function average(values: number[]): number | null {
    if (values.length === 0) return null;
    const raw = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.round(raw * 10) / 10;
}

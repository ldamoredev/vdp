import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';
import { WeightTrendResponse } from '@vdp/shared';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { localDateISO, parseLocalDateISO, todayISO } from '../../common/base/time/dates';
import { WeightEntry, WeightRepository } from '../domain/WeightRepository';
import { serializeWeightEntry } from './SaveWeightEntryCommand';

const DEFAULT_DAYS = 30;

export class GetWeightTrendQuery extends Query<WeightTrendResponse> {
    constructor(readonly days: number = DEFAULT_DAYS) {
        super();
    }
}

export class GetWeightTrendQueryHandler implements RequestHandler<GetWeightTrendQuery, WeightTrendResponse> {
    constructor(private readonly weights: WeightRepository) {}

    async handle(query: GetWeightTrendQuery, identity: Identity): Promise<WeightTrendResponse> {
        const { userId } = requireUserIdentity(identity);
        const days = query.days ?? DEFAULT_DAYS;
        const today = todayISO();
        const fromDate = windowStart(days, today);
        const entries = await this.weights.listWeightEntries(userId, fromDate, today);

        return {
            entries: entries.map(serializeWeightEntry),
            date: today,
            summary: this.summary(entries, days),
        };
    }

    private summary(entries: WeightEntry[], days: number): WeightTrendResponse['summary'] {
        const current = entries.at(-1)?.weightKg ?? null;
        const previous = entries.length > 1 ? entries[0].weightKg : null;
        const change = current && previous ? decimalChange(current, previous) : null;

        return {
            days,
            entryCount: entries.length,
            currentWeightKg: current,
            previousWeightKg: previous,
            changeKg: change,
            direction: direction(change),
        };
    }
}

function windowStart(days: number, today: string): string {
    const d = parseLocalDateISO(today);
    d.setDate(d.getDate() - (days - 1));
    return localDateISO(d);
}

function decimalChange(current: string, previous: string): string {
    const change = Number(current) - Number(previous);
    return change.toFixed(2);
}

function direction(change: string | null): 'up' | 'down' | 'flat' {
    if (!change) return 'flat';
    const value = Number(change);
    if (value > 0) return 'up';
    if (value < 0) return 'down';
    return 'flat';
}

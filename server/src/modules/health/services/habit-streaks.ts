import { diffLocalDateISODays, localDateISO, parseLocalDateISO } from '../../common/base/time/dates';
import { HabitCadenceSpec } from '../domain/Habit';

/**
 * Pure streak math over completion dates (YYYY-MM-DD, newest first).
 * Daily cadence: a streak is a run of consecutive calendar days.
 * Weekly cadence: a streak is a run of consecutive Monday-Sunday weeks that
 * met the target.
 */

type WeekCounts = Map<string, number>;

const DAILY_CADENCE: HabitCadenceSpec = { cadence: 'daily', weeklyTarget: null };

/** Length of the consecutive run that ends exactly at `endDate` (which must be present). */
export function runEndingAt(
    datesDesc: readonly string[],
    endDate: string,
    cadence: HabitCadenceSpec = DAILY_CADENCE,
): number {
    if (isWeekly(cadence)) {
        return runEndingAtWeek(weeklyCounts(datesDesc), weekStartISO(endDate), cadence.weeklyTarget);
    }

    const start = datesDesc.indexOf(endDate);
    if (start === -1) return 0;

    let run = 1;
    for (let i = start; i + 1 < datesDesc.length; i++) {
        if (diffLocalDateISODays(datesDesc[i + 1], datesDesc[i]) === 1) {
            run += 1;
        } else {
            break;
        }
    }

    return run;
}

/**
 * The streak that is still alive on `today`: a run ending today, or ending
 * yesterday (today is still pending, the streak is not broken yet).
 */
export function currentStreak(
    datesDesc: readonly string[],
    today: string,
    cadence: HabitCadenceSpec = DAILY_CADENCE,
): number {
    if (isWeekly(cadence)) {
        const counts = weeklyCounts(datesDesc);
        const thisWeek = weekStartISO(today);
        const endWeek = (counts.get(thisWeek) ?? 0) >= cadence.weeklyTarget
            ? thisWeek
            : addDaysISO(thisWeek, -7);

        return runEndingAtWeek(counts, endWeek, cadence.weeklyTarget);
    }

    const last = datesDesc[0];
    if (!last) return 0;

    const gap = diffLocalDateISODays(last, today);
    if (gap > 1 || gap < 0) return 0;

    return runEndingAt(datesDesc, last);
}

/** Longest run anywhere in the history. */
export function bestStreak(
    datesDesc: readonly string[],
    cadence: HabitCadenceSpec = DAILY_CADENCE,
): number {
    if (isWeekly(cadence)) {
        return bestWeeklyStreak(weeklyCounts(datesDesc), cadence.weeklyTarget);
    }

    let best = 0;
    let run = 0;

    for (let i = 0; i < datesDesc.length; i++) {
        if (i === 0 || diffLocalDateISODays(datesDesc[i], datesDesc[i - 1]) === 1) {
            run += 1;
        } else {
            run = 1;
        }
        if (run > best) best = run;
    }

    return best;
}

export function periodProgress(
    datesDesc: readonly string[],
    today: string,
    cadence: HabitCadenceSpec = DAILY_CADENCE,
): { completions: number; target: number } {
    if (!isWeekly(cadence)) {
        return { completions: datesDesc.includes(today) ? 1 : 0, target: 1 };
    }

    const counts = weeklyCounts(datesDesc);
    return {
        completions: counts.get(weekStartISO(today)) ?? 0,
        target: cadence.weeklyTarget,
    };
}

export function weekStartISO(date: string): string {
    const parsed = parseLocalDateISO(date);
    const daysSinceMonday = (parsed.getDay() + 6) % 7;
    parsed.setDate(parsed.getDate() - daysSinceMonday);
    return localDateISO(parsed);
}

function isWeekly(cadence: HabitCadenceSpec): cadence is { readonly cadence: 'weekly'; readonly weeklyTarget: number } {
    return cadence.cadence === 'weekly';
}

function weeklyCounts(datesDesc: readonly string[]): WeekCounts {
    const counts = new Map<string, number>();

    for (const date of datesDesc) {
        const week = weekStartISO(date);
        counts.set(week, (counts.get(week) ?? 0) + 1);
    }

    return counts;
}

function runEndingAtWeek(counts: WeekCounts, endWeek: string, target: number): number {
    if ((counts.get(endWeek) ?? 0) < target) return 0;

    let run = 0;
    let cursor = endWeek;
    while ((counts.get(cursor) ?? 0) >= target) {
        run += 1;
        cursor = addDaysISO(cursor, -7);
    }

    return run;
}

function bestWeeklyStreak(counts: WeekCounts, target: number): number {
    const metWeeks = Array.from(counts.entries())
        .filter(([, completions]) => completions >= target)
        .map(([week]) => week)
        .sort((left, right) => right.localeCompare(left));

    let best = 0;
    let run = 0;

    for (let i = 0; i < metWeeks.length; i++) {
        if (i === 0 || diffLocalDateISODays(metWeeks[i], metWeeks[i - 1]) === 7) {
            run += 1;
        } else {
            run = 1;
        }
        if (run > best) best = run;
    }

    return best;
}

function addDaysISO(date: string, days: number): string {
    const parsed = parseLocalDateISO(date);
    parsed.setDate(parsed.getDate() + days);
    return localDateISO(parsed);
}

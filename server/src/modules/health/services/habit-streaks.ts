import { diffLocalDateISODays } from '../../common/base/time/dates';

/**
 * Pure streak math over completion dates (YYYY-MM-DD, newest first).
 * Daily cadence only: a streak is a run of consecutive calendar days.
 */

/** Length of the consecutive run that ends exactly at `endDate` (which must be present). */
export function runEndingAt(datesDesc: readonly string[], endDate: string): number {
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
export function currentStreak(datesDesc: readonly string[], today: string): number {
    const last = datesDesc[0];
    if (!last) return 0;

    const gap = diffLocalDateISODays(last, today);
    if (gap > 1 || gap < 0) return 0;

    return runEndingAt(datesDesc, last);
}

/** Longest run anywhere in the history. */
export function bestStreak(datesDesc: readonly string[]): number {
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

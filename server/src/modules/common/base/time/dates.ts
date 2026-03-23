/**
 * Date utilities that respect the local timezone.
 *
 * IMPORTANT: Never use `new Date().toISOString().slice(0, 10)` to get "today"
 * — that converts to UTC first, so at 1 AM UTC-3 it returns yesterday's date.
 */

/** Returns a Date formatted as YYYY-MM-DD in the local timezone. */
export function localDateISO(d: Date = new Date()): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/** Returns today's date as YYYY-MM-DD in the local timezone. */
export function todayISO(): string {
    return localDateISO(new Date());
}

/** Returns tomorrow's date as YYYY-MM-DD in the local timezone. */
export function tomorrowISO(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return localDateISO(d);
}

/** Parses a YYYY-MM-DD string in the local timezone. */
export function parseLocalDateISO(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/** Returns the signed difference in whole calendar days between two local YYYY-MM-DD dates. */
export function diffLocalDateISODays(from: string, to: string): number {
    const fromDate = parseLocalDateISO(from);
    const toDate = parseLocalDateISO(to);
    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    return Math.round((toDate.getTime() - fromDate.getTime()) / millisecondsPerDay);
}

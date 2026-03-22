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

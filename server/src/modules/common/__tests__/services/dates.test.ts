import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

import {
    diffLocalDateISODays,
    localDateISO,
    parseLocalDateISO,
    todayISO,
    tomorrowISO,
} from '../../base/time/dates';

/**
 * Timezone-safety guard for the "today" date helpers.
 *
 * The whole point of these utilities is to avoid `new Date().toISOString()
 * .slice(0, 10)`, which converts to UTC first and therefore returns the wrong
 * calendar day near midnight in non-UTC zones. These tests pin that behavior so
 * a future refactor can't silently reintroduce the UTC bug that would corrupt
 * "today", carry-over, and history.
 */
describe('local date utilities — timezone safety', () => {
    const ORIGINAL_TZ = process.env.TZ;

    afterEach(() => {
        vi.useRealTimers();
    });

    afterAll(() => {
        process.env.TZ = ORIGINAL_TZ;
    });

    it('returns the local day (not the UTC day) late at night in a negative offset zone', () => {
        process.env.TZ = 'America/Argentina/Buenos_Aires'; // UTC-3
        // 02:30Z is 23:30 on the previous local day.
        vi.setSystemTime(new Date('2026-06-08T02:30:00Z'));

        // The naive UTC slice is the bug we are guarding against.
        expect(new Date().toISOString().slice(0, 10)).toBe('2026-06-08');

        expect(todayISO()).toBe('2026-06-07');
        expect(tomorrowISO()).toBe('2026-06-08');
    });

    it('returns the local day (not the UTC day) early morning in a positive offset zone', () => {
        process.env.TZ = 'Asia/Tokyo'; // UTC+9
        // 20:00Z is 05:00 the next local day.
        vi.setSystemTime(new Date('2026-06-08T20:00:00Z'));

        expect(new Date().toISOString().slice(0, 10)).toBe('2026-06-08');

        expect(todayISO()).toBe('2026-06-09');
        expect(tomorrowISO()).toBe('2026-06-10');
    });

    it('rolls tomorrow across a month boundary using local time', () => {
        process.env.TZ = 'America/Argentina/Buenos_Aires';
        vi.setSystemTime(new Date('2026-07-01T02:00:00Z')); // 23:00 on Jun 30 local

        expect(todayISO()).toBe('2026-06-30');
        expect(tomorrowISO()).toBe('2026-07-01');
    });

    it('localDateISO formats an arbitrary instant with local components', () => {
        process.env.TZ = 'America/Argentina/Buenos_Aires';
        expect(localDateISO(new Date('2026-01-05T02:00:00Z'))).toBe('2026-01-04');
    });
});

describe('local date arithmetic', () => {
    it('diffLocalDateISODays counts signed calendar days', () => {
        expect(diffLocalDateISODays('2026-06-07', '2026-06-08')).toBe(1);
        expect(diffLocalDateISODays('2026-06-08', '2026-06-07')).toBe(-1);
        expect(diffLocalDateISODays('2026-06-08', '2026-06-08')).toBe(0);
        expect(diffLocalDateISODays('2026-06-01', '2026-06-30')).toBe(29);
    });

    it('parseLocalDateISO returns a local-midnight date that round-trips', () => {
        const parsed = parseLocalDateISO('2026-06-08');
        expect(localDateISO(parsed)).toBe('2026-06-08');
        expect(parsed.getHours()).toBe(0);
    });
});

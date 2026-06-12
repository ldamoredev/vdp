import { describe, expect, it } from 'vitest';
import { bestStreak, currentStreak, runEndingAt } from '../../services/habit-streaks';

describe('habit-streaks', () => {
    describe('runEndingAt', () => {
        it('counts the consecutive run ending at the given date', () => {
            const dates = ['2026-06-11', '2026-06-10', '2026-06-09', '2026-06-07'];
            expect(runEndingAt(dates, '2026-06-11')).toBe(3);
            expect(runEndingAt(dates, '2026-06-07')).toBe(1);
        });

        it('returns 0 when the date is not present', () => {
            expect(runEndingAt(['2026-06-10'], '2026-06-11')).toBe(0);
        });

        it('crosses month boundaries', () => {
            expect(runEndingAt(['2026-06-01', '2026-05-31', '2026-05-30'], '2026-06-01')).toBe(3);
        });
    });

    describe('currentStreak', () => {
        it('is alive when the last completion was today', () => {
            expect(currentStreak(['2026-06-11', '2026-06-10'], '2026-06-11')).toBe(2);
        });

        it('is still alive when the last completion was yesterday', () => {
            expect(currentStreak(['2026-06-10', '2026-06-09'], '2026-06-11')).toBe(2);
        });

        it('dies after a two-day gap', () => {
            expect(currentStreak(['2026-06-09', '2026-06-08'], '2026-06-11')).toBe(0);
        });

        it('is 0 with no history', () => {
            expect(currentStreak([], '2026-06-11')).toBe(0);
        });
    });

    describe('bestStreak', () => {
        it('finds the longest run anywhere in history', () => {
            const dates = [
                '2026-06-11',
                '2026-06-08', '2026-06-07', '2026-06-06', '2026-06-05',
                '2026-06-01',
            ];
            expect(bestStreak(dates)).toBe(4);
        });

        it('is 0 with no history', () => {
            expect(bestStreak([])).toBe(0);
        });
    });
});

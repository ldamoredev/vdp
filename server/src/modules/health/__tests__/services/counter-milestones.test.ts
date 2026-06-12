import { describe, expect, it } from 'vitest';
import {
    highestMilestoneReached,
    moneyNotSpent,
    pendingMilestone,
} from '../../services/counter-milestones';

describe('counter-milestones', () => {
    describe('highestMilestoneReached', () => {
        it('returns the highest milestone at or below the day count', () => {
            expect(highestMilestoneReached(0)).toBe(0);
            expect(highestMilestoneReached(1)).toBe(1);
            expect(highestMilestoneReached(6)).toBe(1);
            expect(highestMilestoneReached(7)).toBe(7);
            expect(highestMilestoneReached(99)).toBe(30);
            expect(highestMilestoneReached(400)).toBe(365);
        });
    });

    describe('pendingMilestone', () => {
        it('returns the milestone when a new one was crossed', () => {
            expect(pendingMilestone(7, 1)).toBe(7);
            expect(pendingMilestone(8, 1)).toBe(7);
        });

        it('skips intermediate milestones after a long gap instead of spamming', () => {
            expect(pendingMilestone(120, 0)).toBe(100);
        });

        it('returns null when nothing new was crossed', () => {
            expect(pendingMilestone(6, 1)).toBeNull();
            expect(pendingMilestone(0, 0)).toBeNull();
            expect(pendingMilestone(100, 100)).toBeNull();
        });
    });

    describe('moneyNotSpent', () => {
        it('multiplies days by the daily cost', () => {
            expect(moneyNotSpent(94, '4500.00')).toBe('423000.00');
        });

        it('returns null without a usable cost or before day 1', () => {
            expect(moneyNotSpent(94, null)).toBeNull();
            expect(moneyNotSpent(94, '0')).toBeNull();
            expect(moneyNotSpent(94, 'abc')).toBeNull();
            expect(moneyNotSpent(0, '4500.00')).toBeNull();
        });
    });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoginRateLimiter } from '../../services/LoginRateLimiter';

const WINDOW_MS = 15 * 60 * 1000;

describe('LoginRateLimiter', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 11, 10, 0, 0));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('allows attempts below the failure limit', () => {
        const limiter = new LoginRateLimiter(5, WINDOW_MS);

        for (let i = 0; i < 4; i++) {
            limiter.recordFailure('owner@vdp.local');
        }

        expect(limiter.isLimited('owner@vdp.local')).toBe(false);
    });

    it('limits after reaching the failure limit', () => {
        const limiter = new LoginRateLimiter(5, WINDOW_MS);

        for (let i = 0; i < 5; i++) {
            limiter.recordFailure('owner@vdp.local');
        }

        expect(limiter.isLimited('owner@vdp.local')).toBe(true);
    });

    it('expires the failure window over time', () => {
        const limiter = new LoginRateLimiter(5, WINDOW_MS);

        for (let i = 0; i < 5; i++) {
            limiter.recordFailure('owner@vdp.local');
        }
        expect(limiter.isLimited('owner@vdp.local')).toBe(true);

        vi.advanceTimersByTime(WINDOW_MS);

        expect(limiter.isLimited('owner@vdp.local')).toBe(false);
        // The expired window must not leak into the new count.
        expect(limiter.recordFailure('owner@vdp.local')).toBe(1);
    });

    it('clears failures on reset (successful login)', () => {
        const limiter = new LoginRateLimiter(5, WINDOW_MS);

        for (let i = 0; i < 4; i++) {
            limiter.recordFailure('owner@vdp.local');
        }
        limiter.reset('owner@vdp.local');

        expect(limiter.recordFailure('owner@vdp.local')).toBe(1);
        expect(limiter.isLimited('owner@vdp.local')).toBe(false);
    });

    it('normalizes the email key', () => {
        const limiter = new LoginRateLimiter(2, WINDOW_MS);

        limiter.recordFailure('Owner@VDP.local ');
        limiter.recordFailure('owner@vdp.local');

        expect(limiter.isLimited('OWNER@vdp.local')).toBe(true);
    });

    it('tracks emails independently', () => {
        const limiter = new LoginRateLimiter(2, WINDOW_MS);

        limiter.recordFailure('a@vdp.local');
        limiter.recordFailure('a@vdp.local');

        expect(limiter.isLimited('a@vdp.local')).toBe(true);
        expect(limiter.isLimited('b@vdp.local')).toBe(false);
    });
});

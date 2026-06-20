const DEFAULT_MAX_FAILURES = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

type FailureWindow = {
    count: number;
    windowStartedAt: number;
};

/**
 * In-memory failed-login limiter, keyed by lowercased email.
 *
 * Keying by email (not IP) protects the single real account against
 * credential stuffing from many sources; behind the Railway proxy
 * the client IP is unreliable anyway. Trade-off: a flood of failures can
 * lock the owner out for one window — acceptable for a single-user tool
 * where sessions are long-lived. State is per-process and resets on
 * restart, which only ever errs on the permissive side.
 */
export class LoginRateLimiter {
    private failures = new Map<string, FailureWindow>();

    constructor(
        private readonly maxFailures: number = DEFAULT_MAX_FAILURES,
        private readonly windowMs: number = DEFAULT_WINDOW_MS,
    ) {}

    isLimited(email: string): boolean {
        const window = this.activeWindow(this.key(email));
        return window !== undefined && window.count >= this.maxFailures;
    }

    /**
     * Registers a failed attempt and returns the updated count.
     * The caller can compare against `limit` to audit the lockout transition.
     */
    recordFailure(email: string): number {
        const key = this.key(email);
        const window = this.activeWindow(key);

        if (!window) {
            this.failures.set(key, { count: 1, windowStartedAt: Date.now() });
            return 1;
        }

        window.count += 1;
        return window.count;
    }

    reset(email: string): void {
        this.failures.delete(this.key(email));
    }

    get limit(): number {
        return this.maxFailures;
    }

    private activeWindow(key: string): FailureWindow | undefined {
        const window = this.failures.get(key);
        if (!window) return undefined;

        if (Date.now() - window.windowStartedAt >= this.windowMs) {
            this.failures.delete(key);
            return undefined;
        }

        return window;
    }

    private key(email: string): string {
        return email.trim().toLowerCase();
    }
}

export type UsageEvent = {
    ownerUserId: string;
    surface: string;
    action: string;
    /** Local date (YYYY-MM-DD). */
    occurredOn: string;
};

/**
 * Persists owner-usage counters: one row per (owner, surface, action, day),
 * incremented on repeat. Written fire-and-forget from the HTTP layer — an
 * implementation must never be the reason a request fails.
 */
export abstract class UsageEventRepository {
    abstract record(event: UsageEvent): Promise<void>;
}

/**
 * Pure milestone math for "days since" counters.
 * Milestones fire at most once per attempt, detected lazily on overview
 * load and deduped against the counter's lastMilestoneNotified.
 */

export const COUNTER_MILESTONES = [1, 7, 30, 100, 365] as const;

/** Highest milestone at or below `days`, or 0 when none was reached. */
export function highestMilestoneReached(days: number): number {
    let highest = 0;
    for (const milestone of COUNTER_MILESTONES) {
        if (milestone <= days) highest = milestone;
    }
    return highest;
}

/**
 * The milestone to notify now: the highest one reached that was not
 * notified yet. Returns null when there is nothing new — including after
 * long gaps, where intermediate milestones are skipped instead of spammed.
 */
export function pendingMilestone(days: number, lastNotified: number): number | null {
    const highest = highestMilestoneReached(days);
    return highest > lastNotified ? highest : null;
}

export function moneyNotSpent(days: number, dailyCost: string | null): string | null {
    if (!dailyCost || days <= 0) return null;
    const cost = Number.parseFloat(dailyCost);
    if (!Number.isFinite(cost) || cost <= 0) return null;
    return (days * cost).toFixed(2);
}

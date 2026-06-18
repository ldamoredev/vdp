export const COUNTER_MILESTONES = [1, 7, 30, 100, 365] as const;

export function highestMilestoneReached(days: number): number {
    let highest = 0;
    for (const milestone of COUNTER_MILESTONES) {
        if (milestone <= days) highest = milestone;
    }
    return highest;
}

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

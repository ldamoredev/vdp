export class Counter {
    constructor(
        public id: string,
        public name: string,
        public emoji: string | null,
        public dailyCost: string | null,
        public startedAt: string,
        public lastMilestoneNotified: number,
        public archivedAt: Date | null,
        public createdAt: Date,
        public updatedAt: Date,
    ) {}

    /**
     * A relapse closes the current attempt and starts a new one on the
     * relapse date (day 0 is the relapse day itself). Milestone tracking
     * resets with the attempt.
     */
    relapse(onDate: string) {
        this.startedAt = onDate;
        this.lastMilestoneNotified = 0;
        this.updatedAt = new Date();
    }

    markMilestoneNotified(days: number) {
        this.lastMilestoneNotified = days;
        this.updatedAt = new Date();
    }

    archive() {
        this.archivedAt = new Date();
        this.updatedAt = new Date();
    }

    isArchived(): boolean {
        return this.archivedAt !== null;
    }

    toSnapshot(): CounterSnapshot {
        return {
            id: this.id,
            name: this.name,
            emoji: this.emoji,
            dailyCost: this.dailyCost,
            startedAt: this.startedAt,
            lastMilestoneNotified: this.lastMilestoneNotified,
            archivedAt: this.archivedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    static fromSnapshot(s: CounterSnapshot): Counter {
        return new Counter(
            s.id,
            s.name,
            s.emoji,
            s.dailyCost,
            s.startedAt,
            s.lastMilestoneNotified,
            s.archivedAt,
            s.createdAt,
            s.updatedAt,
        );
    }
}

export type CounterSnapshot = {
    id: string;
    name: string;
    emoji: string | null;
    /** Estimated daily cost in ARS; enables the money-not-spent insight. */
    dailyCost: string | null;
    /** Start date (YYYY-MM-DD) of the current attempt. */
    startedAt: string;
    /** Highest milestone (in days) already notified for the current attempt. */
    lastMilestoneNotified: number;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

export type GoalStatus = 'active' | 'done' | 'dropped';

/** Lazy deadline-notification stage; ordered none < t7 < t1. */
export type DeadlineStage = 'none' | 't7' | 't1';

type GoalSnapshotLike = Omit<GoalSnapshot, 'status' | 'deadlineNotified'> & {
    status: string;
    deadlineNotified: string;
};

export class Goal {
    constructor(
        public id: string,
        public title: string,
        public notes: string | null,
        public targetDate: string,
        public targetWeightKg: string | null,
        public status: GoalStatus,
        public deadlineNotified: DeadlineStage,
        public completedAt: Date | null,
        public createdAt: Date,
        public updatedAt: Date,
    ) {}

    complete() {
        this.status = 'done';
        this.completedAt = new Date();
        this.updatedAt = new Date();
    }

    drop() {
        this.status = 'dropped';
        this.updatedAt = new Date();
    }

    markDeadlineNotified(stage: DeadlineStage) {
        this.deadlineNotified = stage;
        this.updatedAt = new Date();
    }

    isActive(): boolean {
        return this.status === 'active';
    }

    toSnapshot(): GoalSnapshot {
        return {
            id: this.id,
            title: this.title,
            notes: this.notes,
            targetDate: this.targetDate,
            targetWeightKg: this.targetWeightKg,
            status: this.status,
            deadlineNotified: this.deadlineNotified,
            completedAt: this.completedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    private static parseStatus(status: string): GoalStatus {
        switch (status) {
            case 'active':
            case 'done':
            case 'dropped':
                return status;
            default:
                throw new Error(`Invalid goal status: ${status}`);
        }
    }

    private static parseStage(stage: string): DeadlineStage {
        switch (stage) {
            case 'none':
            case 't7':
            case 't1':
                return stage;
            default:
                throw new Error(`Invalid deadline stage: ${stage}`);
        }
    }

    static fromSnapshot(s: GoalSnapshotLike): Goal {
        return new Goal(
            s.id,
            s.title,
            s.notes,
            s.targetDate,
            s.targetWeightKg,
            Goal.parseStatus(s.status),
            Goal.parseStage(s.deadlineNotified),
            s.completedAt,
            s.createdAt,
            s.updatedAt,
        );
    }
}

export type GoalSnapshot = {
    id: string;
    title: string;
    notes: string | null;
    targetDate: string;
    targetWeightKg: string | null;
    status: GoalStatus;
    deadlineNotified: DeadlineStage;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

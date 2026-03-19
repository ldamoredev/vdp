export class Task {
    constructor(
        public id: string,
        public createdAt: Date,
        public description: string | null,
        public updatedAt: Date,
        public completedAt: Date | null,
        public title: string,
        public status: string,
        public priority: number,
        public scheduledDate: string,
        public domain: string | null,
        public carryOverCount: number,
    ) {}

    complete() {
        this.status = "done";
        this.completedAt = new Date();
        this.updatedAt = new Date();
    }

    carryOver(toDate: string) {
        this.status = "pending";
        this.scheduledDate = toDate;
        this.carryOverCount += 1;
        this.updatedAt = new Date();
    }

    discard() {
        this.status = "discarded";
        this.updatedAt = new Date();
    }

    isStuck(): boolean {
        return this.carryOverCount >= 3;
    }

    toSnapshot(): TaskSnapshot {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            status: this.status,
            priority: this.priority,
            scheduledDate: this.scheduledDate,
            domain: this.domain,
            completedAt: this.completedAt,
            carryOverCount: this.carryOverCount,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    static fromSnapshot(s: TaskSnapshot): Task {
        return new Task(
            s.id,
            s.createdAt,
            s.description,
            s.updatedAt,
            s.completedAt,
            s.title,
            s.status,
            s.priority,
            s.scheduledDate,
            s.domain,
            s.carryOverCount,
        );
    }
}

export type TaskSnapshot = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: number;
    scheduledDate: string;
    domain: string | null;
    completedAt: Date | null;
    carryOverCount: number;
    createdAt: Date;
    updatedAt: Date;
};

export class TimeEntry {
    constructor(
        public id: string,
        public projectId: string,
        public taskId: string | null,
        public date: string,
        public minutes: number,
        public note: string | null,
        public createdAt: Date,
        public updatedAt: Date,
    ) {
        TimeEntry.assertPositiveMinutes(minutes);
    }

    update(data: TimeEntryUpdate) {
        if (data.projectId !== undefined) this.projectId = data.projectId;
        if (data.taskId !== undefined) this.taskId = data.taskId;
        if (data.date !== undefined) this.date = data.date;
        if (data.minutes !== undefined) {
            TimeEntry.assertPositiveMinutes(data.minutes);
            this.minutes = data.minutes;
        }
        if (data.note !== undefined) this.note = data.note;
        this.updatedAt = new Date();
    }

    toSnapshot(): TimeEntrySnapshot {
        return {
            id: this.id,
            projectId: this.projectId,
            taskId: this.taskId,
            date: this.date,
            minutes: this.minutes,
            note: this.note,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    static fromSnapshot(s: TimeEntrySnapshot): TimeEntry {
        return new TimeEntry(
            s.id,
            s.projectId,
            s.taskId,
            s.date,
            s.minutes,
            s.note,
            s.createdAt,
            s.updatedAt,
        );
    }

    private static assertPositiveMinutes(minutes: number) {
        if (!Number.isInteger(minutes) || minutes <= 0) {
            throw new Error('Time entry minutes must be positive');
        }
    }
}

export type TimeEntryUpdate = {
    projectId?: string;
    taskId?: string | null;
    date?: string;
    minutes?: number;
    note?: string | null;
};

export type TimeEntrySnapshot = {
    id: string;
    projectId: string;
    taskId: string | null;
    date: string;
    minutes: number;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'discarded';
export type TaskBoardStatus = 'backlog' | 'next' | 'doing' | 'done';
type TaskSnapshotLike = Omit<TaskSnapshot, 'status' | 'boardStatus'> & {
    status: string;
    boardStatus?: string | null;
};


export class Task {
    constructor(
        public id: string,
        public createdAt: Date,
        public description: string | null,
        public updatedAt: Date,
        public completedAt: Date | null,
        public title: string,
        public status: TaskStatus,
        public priority: number,
        public scheduledDate: string,
        public domain: string | null,
        public carryOverCount: number,
        public projectId: string | null = null,
        public boardStatus: TaskBoardStatus = 'backlog',
    ) {}

    start() {
        this.status = "in_progress";
        this.completedAt = null;
        this.updatedAt = new Date();
    }

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

    assignToProject(projectId: string, boardStatus: TaskBoardStatus = 'backlog') {
        this.projectId = projectId;
        this.boardStatus = boardStatus;
        this.updatedAt = new Date();
    }

    unassignFromProject() {
        this.projectId = null;
        this.boardStatus = 'backlog';
        this.updatedAt = new Date();
    }

    isStuck(): boolean {
        return this.carryOverCount >= 3;
    }

    isOpen(): boolean {
        return this.status === 'pending' || this.status === 'in_progress';
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
            projectId: this.projectId,
            boardStatus: this.boardStatus,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    private static parseBoardStatus(status: string | null | undefined): TaskBoardStatus {
        const value = status ?? 'backlog';
        switch (value) {
            case 'backlog':
            case 'next':
            case 'doing':
            case 'done':
                return value;
            default:
                throw new Error(`Invalid task board status: ${status}`);
        }
    }

    private static parseTaskStatus(status: string): TaskStatus {
        switch (status) {
            case 'pending':
            case 'in_progress':
            case 'done':
            case 'discarded':
                return status;
            default:
                throw new Error(`Invalid task status: ${status}`);
        }
    }

    static fromSnapshot(s: TaskSnapshotLike): Task {
        return new Task(
            s.id,
            s.createdAt,
            s.description,
            s.updatedAt,
            s.completedAt,
            s.title,
            Task.parseTaskStatus(s.status),
            s.priority,
            s.scheduledDate,
            s.domain,
            s.carryOverCount,
            s.projectId ?? null,
            Task.parseBoardStatus(s.boardStatus),
        );
    }
}

export type TaskSnapshot = {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: number;
    scheduledDate: string;
    domain: string | null;
    completedAt: Date | null;
    carryOverCount: number;
    projectId: string | null;
    boardStatus: TaskBoardStatus;
    createdAt: Date;
    updatedAt: Date;
};

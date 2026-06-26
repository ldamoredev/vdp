export type ProjectKind = 'work' | 'personal';
export type ProjectStatus = 'active' | 'archived';

type ProjectSnapshotLike = Omit<ProjectSnapshot, 'kind' | 'status' | 'clientId'> & {
    kind: string;
    status: string;
    clientId?: string | null;
};

export class Project {
    constructor(
        public id: string,
        public kind: ProjectKind,
        public outcome: string,
        public nextAction: string,
        public focus: string,
        public clientId: string | null,
        public client: string | null,
        public status: ProjectStatus,
        public archivedAt: Date | null,
        public createdAt: Date,
        public updatedAt: Date,
    ) {}

    updateDirection(data: ProjectUpdate) {
        if (data.kind !== undefined) this.kind = data.kind;
        if (data.outcome !== undefined) this.outcome = data.outcome;
        if (data.nextAction !== undefined) this.nextAction = data.nextAction;
        if (data.focus !== undefined) this.focus = data.focus;
        if (data.clientId !== undefined) this.clientId = data.clientId;
        if (data.client !== undefined) this.client = data.client;
        this.updatedAt = new Date();
    }

    archive() {
        if (this.status === 'archived') return;
        this.status = 'archived';
        this.archivedAt = new Date();
        this.updatedAt = new Date();
    }

    isActive(): boolean {
        return this.status === 'active';
    }

    toSnapshot(): ProjectSnapshot {
        return {
            id: this.id,
            kind: this.kind,
            outcome: this.outcome,
            nextAction: this.nextAction,
            focus: this.focus,
            clientId: this.clientId,
            client: this.client,
            status: this.status,
            archivedAt: this.archivedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    private static parseKind(kind: string): ProjectKind {
        switch (kind) {
            case 'work':
            case 'personal':
                return kind;
            default:
                throw new Error(`Invalid project kind: ${kind}`);
        }
    }

    private static parseStatus(status: string): ProjectStatus {
        switch (status) {
            case 'active':
            case 'archived':
                return status;
            default:
                throw new Error(`Invalid project status: ${status}`);
        }
    }

    static fromSnapshot(s: ProjectSnapshotLike): Project {
        return new Project(
            s.id,
            Project.parseKind(s.kind),
            s.outcome,
            s.nextAction,
            s.focus,
            s.clientId ?? null,
            s.client,
            Project.parseStatus(s.status),
            s.archivedAt,
            s.createdAt,
            s.updatedAt,
        );
    }
}

export type ProjectUpdate = {
    kind?: ProjectKind;
    outcome?: string;
    nextAction?: string;
    focus?: string;
    clientId?: string | null;
    client?: string | null;
};

export type ProjectSnapshot = {
    id: string;
    kind: ProjectKind;
    outcome: string;
    nextAction: string;
    focus: string;
    clientId: string | null;
    client: string | null;
    status: ProjectStatus;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

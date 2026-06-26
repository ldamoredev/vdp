export type ClientStatus = 'active' | 'archived';

type ClientSnapshotLike = Omit<ClientSnapshot, 'status'> & {
    status: string;
};

export class Client {
    constructor(
        public id: string,
        public name: string,
        public status: ClientStatus,
        public archivedAt: Date | null,
        public createdAt: Date,
        public updatedAt: Date,
    ) {}

    rename(name: string) {
        this.name = name;
        this.updatedAt = new Date();
    }

    archive() {
        if (this.status === 'archived') return;
        this.status = 'archived';
        this.archivedAt = new Date();
        this.updatedAt = new Date();
    }

    toSnapshot(): ClientSnapshot {
        return {
            id: this.id,
            name: this.name,
            status: this.status,
            archivedAt: this.archivedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    private static parseStatus(status: string): ClientStatus {
        switch (status) {
            case 'active':
            case 'archived':
                return status;
            default:
                throw new Error(`Invalid client status: ${status}`);
        }
    }

    static fromSnapshot(s: ClientSnapshotLike): Client {
        return new Client(
            s.id,
            s.name,
            Client.parseStatus(s.status),
            s.archivedAt,
            s.createdAt,
            s.updatedAt,
        );
    }
}

export type ClientSnapshot = {
    id: string;
    name: string;
    status: ClientStatus;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

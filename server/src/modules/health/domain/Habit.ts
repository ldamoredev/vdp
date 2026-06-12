export class Habit {
    constructor(
        public id: string,
        public name: string,
        public emoji: string | null,
        public archivedAt: Date | null,
        public createdAt: Date,
        public updatedAt: Date,
    ) {}

    archive() {
        this.archivedAt = new Date();
        this.updatedAt = new Date();
    }

    isArchived(): boolean {
        return this.archivedAt !== null;
    }

    toSnapshot(): HabitSnapshot {
        return {
            id: this.id,
            name: this.name,
            emoji: this.emoji,
            archivedAt: this.archivedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    static fromSnapshot(s: HabitSnapshot): Habit {
        return new Habit(s.id, s.name, s.emoji, s.archivedAt, s.createdAt, s.updatedAt);
    }
}

export type HabitSnapshot = {
    id: string;
    name: string;
    emoji: string | null;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

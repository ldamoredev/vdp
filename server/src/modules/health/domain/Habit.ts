export type HabitCadence = 'daily' | 'weekly';
export type HabitCadenceSpec =
    | { readonly cadence?: 'daily'; readonly weeklyTarget?: number | null }
    | { readonly cadence: 'weekly'; readonly weeklyTarget: number };

type HabitSnapshotLike = Omit<HabitSnapshot, 'cadence'> & {
    cadence?: string;
};

export class Habit {
    constructor(
        public id: string,
        public name: string,
        public emoji: string | null,
        public archivedAt: Date | null,
        public createdAt: Date,
        public updatedAt: Date,
        public cadence: HabitCadence = 'daily',
        public weeklyTarget: number | null = null,
    ) {}

    archive() {
        this.archivedAt = new Date();
        this.updatedAt = new Date();
    }

    isArchived(): boolean {
        return this.archivedAt !== null;
    }

    cadenceSpec(): HabitCadenceSpec {
        return this.cadence === 'weekly'
            ? { cadence: 'weekly', weeklyTarget: this.weeklyTarget ?? 1 }
            : { cadence: 'daily', weeklyTarget: null };
    }

    toSnapshot(): HabitSnapshot {
        return {
            id: this.id,
            name: this.name,
            emoji: this.emoji,
            cadence: this.cadence,
            weeklyTarget: this.weeklyTarget,
            archivedAt: this.archivedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    private static parseCadence(cadence: string | undefined): HabitCadence {
        const value = cadence ?? 'daily';
        switch (value) {
            case 'daily':
            case 'weekly':
                return value;
            default:
                throw new Error(`Invalid habit cadence: ${cadence}`);
        }
    }

    static fromSnapshot(s: HabitSnapshotLike): Habit {
        return new Habit(
            s.id,
            s.name,
            s.emoji,
            s.archivedAt,
            s.createdAt,
            s.updatedAt,
            Habit.parseCadence(s.cadence),
            s.weeklyTarget ?? null,
        );
    }
}

export type HabitSnapshot = {
    id: string;
    name: string;
    emoji: string | null;
    cadence: HabitCadence;
    weeklyTarget: number | null;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

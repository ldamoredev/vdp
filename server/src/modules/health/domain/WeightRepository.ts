export type WeightEntry = {
    readonly id: string;
    readonly date: string;
    readonly weightKg: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
};

export type SaveWeightEntryData = {
    readonly date: string;
    readonly weightKg: string;
};

export abstract class WeightRepository {
    abstract saveWeightEntry(userId: string, data: SaveWeightEntryData): Promise<WeightEntry>;
    abstract listWeightEntries(userId: string, fromDate: string, toDate: string): Promise<WeightEntry[]>;
}

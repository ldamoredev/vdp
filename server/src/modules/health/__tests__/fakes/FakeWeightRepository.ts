import { randomUUID } from 'crypto';

import {
    SaveWeightEntryData,
    WeightEntry,
    WeightRepository,
} from '../../domain/WeightRepository';

type StoredWeightEntry = {
    entry: WeightEntry;
    userId: string;
};

export class FakeWeightRepository extends WeightRepository {
    private entries = new Map<string, StoredWeightEntry>();

    async saveWeightEntry(userId: string, data: SaveWeightEntryData): Promise<WeightEntry> {
        const key = this.key(userId, data.date);
        const existing = this.entries.get(key)?.entry;
        const now = new Date();
        const entry: WeightEntry = {
            id: existing?.id ?? randomUUID(),
            date: data.date,
            weightKg: data.weightKg,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
        };
        this.entries.set(key, { entry, userId });
        return entry;
    }

    async listWeightEntries(userId: string, fromDate: string, toDate: string): Promise<WeightEntry[]> {
        return Array.from(this.entries.values())
            .filter((stored) => stored.userId === userId)
            .map((stored) => stored.entry)
            .filter((entry) => entry.date >= fromDate && entry.date <= toDate)
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    private key(userId: string, date: string): string {
        return `${userId}:${date}`;
    }
}

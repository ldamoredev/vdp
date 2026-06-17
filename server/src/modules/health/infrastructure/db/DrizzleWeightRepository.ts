import { and, asc, eq, gte, lte } from 'drizzle-orm';

import { Database } from '../../../common/base/db/Database';
import {
    SaveWeightEntryData,
    WeightEntry,
    WeightRepository,
} from '../../domain/WeightRepository';
import { weightEntries } from './schema';

export class DrizzleWeightRepository extends WeightRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async saveWeightEntry(userId: string, data: SaveWeightEntryData): Promise<WeightEntry> {
        const [row] = await this.db.query
            .insert(weightEntries)
            .values({
                ownerUserId: userId,
                date: data.date,
                weightKg: data.weightKg,
            })
            .onConflictDoUpdate({
                target: [weightEntries.ownerUserId, weightEntries.date],
                set: {
                    weightKg: data.weightKg,
                    updatedAt: new Date(),
                },
            })
            .returning();

        return this.toWeightEntry(row);
    }

    async listWeightEntries(userId: string, fromDate: string, toDate: string): Promise<WeightEntry[]> {
        const rows = await this.db.query
            .select()
            .from(weightEntries)
            .where(and(
                eq(weightEntries.ownerUserId, userId),
                gte(weightEntries.date, fromDate),
                lte(weightEntries.date, toDate),
            ))
            .orderBy(asc(weightEntries.date));

        return rows.map((row) => this.toWeightEntry(row));
    }

    private toWeightEntry(row: typeof weightEntries.$inferSelect): WeightEntry {
        return {
            id: row.id,
            date: row.date,
            weightKg: row.weightKg,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}

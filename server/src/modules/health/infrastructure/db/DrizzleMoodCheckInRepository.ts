import { and, desc, eq, gte, lte } from 'drizzle-orm';

import { Database } from '../../../common/base/db/Database';
import {
    MoodCheckIn,
    MoodCheckInRepository,
    SaveMoodCheckInData,
} from '../../domain/MoodCheckInRepository';
import { moodCheckIns } from './schema';

export class DrizzleMoodCheckInRepository extends MoodCheckInRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async saveMoodCheckIn(userId: string, data: SaveMoodCheckInData): Promise<MoodCheckIn> {
        const [row] = await this.db.query
            .insert(moodCheckIns)
            .values({
                ownerUserId: userId,
                date: data.date,
                mood: data.mood,
                energy: data.energy,
            })
            .onConflictDoUpdate({
                target: [moodCheckIns.ownerUserId, moodCheckIns.date],
                set: {
                    mood: data.mood,
                    energy: data.energy,
                    updatedAt: new Date(),
                },
            })
            .returning();

        return this.toMoodCheckIn(row);
    }

    async listMoodCheckIns(userId: string, fromDate: string, toDate: string): Promise<MoodCheckIn[]> {
        const rows = await this.db.query
            .select()
            .from(moodCheckIns)
            .where(and(
                eq(moodCheckIns.ownerUserId, userId),
                gte(moodCheckIns.date, fromDate),
                lte(moodCheckIns.date, toDate),
            ))
            .orderBy(desc(moodCheckIns.date));

        return rows.map((row) => this.toMoodCheckIn(row));
    }

    private toMoodCheckIn(row: typeof moodCheckIns.$inferSelect): MoodCheckIn {
        return {
            id: row.id,
            date: row.date,
            mood: row.mood,
            energy: row.energy,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}

import { randomUUID } from 'crypto';

import {
    MoodCheckIn,
    MoodCheckInRepository,
    SaveMoodCheckInData,
} from '../../domain/MoodCheckInRepository';

type StoredMoodCheckIn = {
    checkIn: MoodCheckIn;
    userId: string;
};

export class FakeMoodCheckInRepository extends MoodCheckInRepository {
    private checkIns = new Map<string, StoredMoodCheckIn>();

    async saveMoodCheckIn(userId: string, data: SaveMoodCheckInData): Promise<MoodCheckIn> {
        const key = this.key(userId, data.date);
        const existing = this.checkIns.get(key)?.checkIn;
        const now = new Date();
        const checkIn: MoodCheckIn = {
            id: existing?.id ?? randomUUID(),
            date: data.date,
            mood: data.mood,
            energy: data.energy,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
        };
        this.checkIns.set(key, { checkIn, userId });
        return checkIn;
    }

    async listMoodCheckIns(userId: string, fromDate: string, toDate: string): Promise<MoodCheckIn[]> {
        return Array.from(this.checkIns.values())
            .filter((stored) => stored.userId === userId)
            .map((stored) => stored.checkIn)
            .filter((checkIn) => checkIn.date >= fromDate && checkIn.date <= toDate)
            .sort((a, b) => b.date.localeCompare(a.date));
    }

    private key(userId: string, date: string): string {
        return `${userId}:${date}`;
    }
}

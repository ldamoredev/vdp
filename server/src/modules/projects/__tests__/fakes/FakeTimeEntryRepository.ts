import { randomUUID } from 'crypto';

import { TimeEntry, type TimeEntrySnapshot } from '../../domain/TimeEntry';
import {
    type CreateTimeEntryData,
    type TimeEntryFilters,
    TimeEntryRepository,
} from '../../domain/TimeEntryRepository';

export class FakeTimeEntryRepository extends TimeEntryRepository {
    private store = new Map<string, TimeEntrySnapshot>();

    async createTimeEntry(_userId: string, data: CreateTimeEntryData): Promise<TimeEntry> {
        const now = new Date();
        const entry = TimeEntry.fromSnapshot({
            id: randomUUID(),
            projectId: data.projectId,
            taskId: data.taskId ?? null,
            date: data.date,
            minutes: data.minutes,
            note: data.note ?? null,
            createdAt: now,
            updatedAt: now,
        });
        this.store.set(entry.id, entry.toSnapshot());
        return entry;
    }

    async getTimeEntry(_userId: string, id: string): Promise<TimeEntry | null> {
        const snapshot = this.store.get(id);
        return snapshot ? TimeEntry.fromSnapshot(snapshot) : null;
    }

    async listTimeEntries(_userId: string, filters: TimeEntryFilters): Promise<TimeEntry[]> {
        return Array.from(this.store.values())
            .filter((entry) => !filters.projectId || entry.projectId === filters.projectId)
            .filter((entry) => !filters.fromDate || entry.date >= filters.fromDate)
            .filter((entry) => !filters.toDate || entry.date <= filters.toDate)
            .map(TimeEntry.fromSnapshot);
    }

    async save(_userId: string, entry: TimeEntry): Promise<TimeEntry> {
        this.store.set(entry.id, entry.toSnapshot());
        return entry;
    }

    async deleteTimeEntry(_userId: string, id: string): Promise<boolean> {
        return this.store.delete(id);
    }
}

import { TimeEntry } from './TimeEntry';

export type CreateTimeEntryData = {
    readonly projectId: string;
    readonly taskId?: string | null;
    readonly date: string;
    readonly minutes: number;
    readonly note?: string | null;
};

export type TimeEntryFilters = {
    readonly projectId?: string;
    readonly fromDate?: string;
    readonly toDate?: string;
};

export abstract class TimeEntryRepository {
    abstract createTimeEntry(userId: string, data: CreateTimeEntryData): Promise<TimeEntry>;
    abstract getTimeEntry(userId: string, id: string): Promise<TimeEntry | null>;
    abstract listTimeEntries(userId: string, filters: TimeEntryFilters): Promise<TimeEntry[]>;
    abstract save(userId: string, entry: TimeEntry): Promise<TimeEntry>;
    abstract deleteTimeEntry(userId: string, id: string): Promise<boolean>;
}

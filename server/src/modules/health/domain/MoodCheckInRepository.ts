export type MoodCheckIn = {
    readonly id: string;
    readonly date: string;
    readonly mood: number;
    readonly energy: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
};

export type SaveMoodCheckInData = {
    readonly date: string;
    readonly mood: number;
    readonly energy: number;
};

export abstract class MoodCheckInRepository {
    abstract saveMoodCheckIn(userId: string, data: SaveMoodCheckInData): Promise<MoodCheckIn>;
    abstract listMoodCheckIns(userId: string, fromDate: string, toDate: string): Promise<MoodCheckIn[]>;
}

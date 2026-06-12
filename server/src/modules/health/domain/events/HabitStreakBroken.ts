import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

export type HabitStreakBrokenPayload = {
    readonly userId: string;
    readonly habitId: string;
    readonly habitName: string;
    readonly lostStreak: number;
    readonly lastCompletedDate: string;
    readonly resumedDate: string;
};

export class HabitStreakBroken extends DomainEvent<HabitStreakBrokenPayload> {
    constructor(payload: HabitStreakBrokenPayload) {
        super('health', 'habit.streak_broken', payload);
    }
}

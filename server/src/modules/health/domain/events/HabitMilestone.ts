import { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

export type HabitMilestonePayload = {
    readonly userId: string;
    readonly habitId: string;
    readonly habitName: string;
    readonly streak: number;
    readonly streakUnit?: 'day' | 'week';
};

export class HabitMilestone extends DomainEvent<HabitMilestonePayload> {
    constructor(payload: HabitMilestonePayload) {
        super('health', 'habit.milestone', payload);
    }
}

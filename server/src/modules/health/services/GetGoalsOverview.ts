import { EventBus } from '../../common/base/event-bus/EventBus';
import { diffLocalDateISODays, todayISO } from '../../common/base/time/dates';
import { DeadlineStage, Goal } from '../domain/Goal';
import { GoalRepository } from '../domain/GoalRepository';
import { GoalDeadlineApproaching } from '../domain/events/GoalDeadlineApproaching';

export type GoalOverviewRow = {
    readonly id: string;
    readonly title: string;
    readonly notes: string | null;
    readonly targetDate: string;
    readonly status: string;
    readonly completedAt: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly daysLeft: number;
};

export type GoalsOverview = {
    readonly goals: GoalOverviewRow[];
    readonly date: string;
};

const STAGE_ORDER: Record<DeadlineStage, number> = { none: 0, t7: 1, t1: 2 };

/**
 * Read model for goals. Deadline detection happens here, lazily, with the
 * same dedupe-before-emit discipline as counter milestones: the stage is
 * persisted BEFORE the event goes out, so a failed emit can never duplicate.
 * Jumping straight to t1 skips t7 — one signal, the most urgent one.
 */
export class GetGoalsOverview {
    constructor(
        private readonly goals: GoalRepository,
        private readonly eventBus: EventBus,
    ) {}

    async execute(userId: string): Promise<GoalsOverview> {
        const today = todayISO();
        const allGoals = await this.goals.listGoals(userId);

        const rows: GoalOverviewRow[] = [];
        for (const goal of allGoals) {
            if (goal.isActive()) {
                await this.notifyApproachingDeadline(userId, goal, today);
            }
            rows.push(this.buildRow(goal, today));
        }

        return { goals: rows, date: today };
    }

    buildRow(goal: Goal, today: string = todayISO()): GoalOverviewRow {
        const snapshot = goal.toSnapshot();
        return {
            id: snapshot.id,
            title: snapshot.title,
            notes: snapshot.notes,
            targetDate: snapshot.targetDate,
            status: snapshot.status,
            completedAt: snapshot.completedAt,
            createdAt: snapshot.createdAt,
            updatedAt: snapshot.updatedAt,
            daysLeft: diffLocalDateISODays(today, snapshot.targetDate),
        };
    }

    private async notifyApproachingDeadline(userId: string, goal: Goal, today: string): Promise<void> {
        const daysLeft = diffLocalDateISODays(today, goal.targetDate);

        let stage: DeadlineStage | null = null;
        if (daysLeft <= 1 && STAGE_ORDER[goal.deadlineNotified] < STAGE_ORDER.t1) {
            stage = 't1';
        } else if (daysLeft <= 7 && STAGE_ORDER[goal.deadlineNotified] < STAGE_ORDER.t7) {
            stage = 't7';
        }
        if (!stage) return;

        goal.markDeadlineNotified(stage);
        await this.goals.save(userId, goal);

        void this.eventBus.emit(new GoalDeadlineApproaching({
            userId,
            goalId: goal.id,
            title: goal.title,
            targetDate: goal.targetDate,
            daysLeft,
        }));
    }
}

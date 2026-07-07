import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { diffLocalDateISODays, todayISO } from '../../common/base/time/dates';
import { Objective } from '../domain/Objective';
import { ObjectiveRepository } from '../domain/ObjectiveRepository';
import { ObjectiveDeadlineApproaching } from '../domain/events/ObjectiveDeadlineApproaching';

export type ObjectivesOverview = {
    readonly objectives: Objective[];
    readonly date: string;
};

type DeadlineThreshold = {
    readonly stage: 't30' | 't14';
    readonly days: number;
};

const STAGE_ORDER: Record<'none' | 't30' | 't14', number> = { none: 0, t30: 1, t14: 2 };
const SHORT_OBJECTIVE_THRESHOLD_DAYS = 90;

export class GetObjectivesOverviewQuery extends Query<ObjectivesOverview> {}

export class GetObjectivesOverviewQueryHandler implements RequestHandler<GetObjectivesOverviewQuery, ObjectivesOverview> {
    constructor(
        private readonly objectives: ObjectiveRepository,
        private readonly eventBus: EventBus,
    ) {}

    async handle(_query: GetObjectivesOverviewQuery, identity: Identity): Promise<ObjectivesOverview> {
        const { userId } = requireUserIdentity(identity);
        const today = todayISO();
        const allObjectives = await this.objectives.listObjectives(userId);

        for (const objective of allObjectives) {
            if (objective.isActive()) {
                await this.notifyApproachingDeadline(userId, objective, today);
            }
        }

        return { objectives: allObjectives, date: today };
    }

    private async notifyApproachingDeadline(userId: string, objective: Objective, today: string): Promise<void> {
        if (!this.isBelowTarget(objective)) return;

        const daysLeft = diffLocalDateISODays(today, objective.periodEnd);
        const stage = this.pendingDeadlineStage(objective, daysLeft);
        if (!stage) return;

        objective.markDeadlineNotified(stage);
        await this.objectives.save(userId, objective);

        void this.eventBus.emit(new ObjectiveDeadlineApproaching({
            userId,
            objectiveId: objective.id,
            title: objective.title,
            periodEnd: objective.periodEnd,
            daysLeft,
            progress: objective.metricSource === 'manual' ? objective.manualValue : null,
            target: objective.target,
            unit: objective.unit,
            metricSource: objective.metricSource,
        }));
    }

    private isBelowTarget(objective: Objective): boolean {
        if (objective.metricSource === 'manual') {
            return (objective.manualValue ?? 0) < objective.target;
        }
        return true;
    }

    private pendingDeadlineStage(objective: Objective, daysLeft: number): 't30' | 't14' | null {
        const thresholds = this.thresholdsFor(objective);
        const lastNotified = objective.lastDeadlineNotified;

        // Highest stage first so after long gaps we emit only the highest crossed threshold.
        for (const threshold of thresholds) {
            if (daysLeft <= threshold.days && STAGE_ORDER[lastNotified] < STAGE_ORDER[threshold.stage]) {
                return threshold.stage;
            }
        }
        return null;
    }

    private thresholdsFor(objective: Objective): DeadlineThreshold[] {
        const durationDays = diffLocalDateISODays(objective.periodStart, objective.periodEnd) + 1;
        const isLong = durationDays > SHORT_OBJECTIVE_THRESHOLD_DAYS;

        return isLong
            ? [{ stage: 't14', days: 14 }, { stage: 't30', days: 30 }]
            : [{ stage: 't14', days: 14 }];
    }
}

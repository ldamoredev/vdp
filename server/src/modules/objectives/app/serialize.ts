import type { Objective as ObjectiveDto } from '@vdp/shared';

import { Objective } from '../domain/Objective';

export function serializeObjective(objective: Objective): ObjectiveDto {
    const snapshot = objective.toSnapshot();
    return {
        id: snapshot.id,
        title: snapshot.title,
        periodStart: snapshot.periodStart,
        periodEnd: snapshot.periodEnd,
        metricSource: snapshot.metricSource,
        target: snapshot.target,
        unit: snapshot.unit,
        manualValue: snapshot.manualValue,
        currency: snapshot.currency,
        status: snapshot.status,
        archivedAt: snapshot.archivedAt?.toISOString() ?? null,
        achievedAt: snapshot.achievedAt?.toISOString() ?? null,
        createdAt: snapshot.createdAt.toISOString(),
        updatedAt: snapshot.updatedAt.toISOString(),
    };
}

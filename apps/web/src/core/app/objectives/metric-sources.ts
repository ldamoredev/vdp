import type { ObjectiveMetricSource } from "@vdp/shared";

import type { Core } from "../../Core";
import { GetHoursReport } from "../projects/GetHoursReport";
import { GetTasksByDomain } from "../tasks/GetTasksByDomain";
import type { Objective } from "../../domain/objectives/Objective";

export interface ObjectiveMetricSourceDefinition {
  source: ObjectiveMetricSource;
  isCurrencyScoped: boolean;
  getCurrentValue(objective: Objective, core: Core): Promise<number>;
}

export const objectiveMetricSourceCatalog: Record<ObjectiveMetricSource, ObjectiveMetricSourceDefinition> = {
  manual: {
    source: "manual",
    isCurrencyScoped: false,
    async getCurrentValue(objective) {
      return objective.manualValue ?? 0;
    },
  },
  projects_hours: {
    source: "projects_hours",
    isCurrencyScoped: false,
    async getCurrentValue(objective, core) {
      const report = await core.execute(new GetHoursReport({
        fromDate: objective.periodStart,
        toDate: objective.periodEnd,
      }));
      return report.totalMinutes / 60;
    },
  },
  tasks_completed: {
    source: "tasks_completed",
    isCurrencyScoped: false,
    async getCurrentValue(objective, core) {
      const stats = await core.execute(new GetTasksByDomain({
        from: objective.periodStart,
        to: objective.periodEnd,
      }));
      return stats.reduce((total, stat) => total + stat.count, 0);
    },
  },
};

export function resolveObjectiveCurrentValue(objective: Objective, core: Core): Promise<number> {
  return objectiveMetricSourceCatalog[objective.metricSource].getCurrentValue(objective, core);
}

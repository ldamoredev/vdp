import type { ObjectiveCurrency, ObjectiveMetricSource } from "@vdp/shared";

import type { Objective } from "./Objective";

export type ObjectivesOverview = {
  objectives: Objective[];
  date: string;
};

export interface CreateObjectiveInput {
  title: string;
  periodStart: string;
  periodEnd: string;
  metricSource: ObjectiveMetricSource;
  metricTargetId?: string | null;
  target: number;
  unit: string;
  manualValue?: number | null;
  currency?: ObjectiveCurrency | null;
}

export type UpdateObjectiveInput = Partial<CreateObjectiveInput>;

export interface ObjectivesGateway {
  listObjectives(): Promise<Objective[]>;
  getObjectivesOverview(): Promise<ObjectivesOverview>;
  getObjective(id: string): Promise<Objective | null>;
  createObjective(input: CreateObjectiveInput): Promise<Objective>;
  updateObjective(id: string, input: UpdateObjectiveInput): Promise<Objective>;
  archiveObjective(id: string): Promise<Objective>;
  markObjectiveAchieved(id: string): Promise<Objective>;
}

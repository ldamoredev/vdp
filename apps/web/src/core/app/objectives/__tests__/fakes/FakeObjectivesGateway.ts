import type { Objective as ObjectiveDto } from "@vdp/shared";

import { Objective } from "../../../../domain/objectives/Objective";
import type {
  CreateObjectiveInput,
  ObjectivesGateway,
  UpdateObjectiveInput,
} from "../../../../domain/objectives/ObjectivesGateway";

export interface RecordedCall {
  method: string;
  args: unknown[];
}

const objectiveDto: ObjectiveDto = {
  id: "o1",
  title: "120 horas",
  periodStart: "2026-07-01",
  periodEnd: "2026-09-30",
  metricSource: "projects_hours",
  target: 120,
  unit: "h",
  manualValue: null,
  status: "active",
  archivedAt: null,
  achievedAt: null,
  createdAt: "2026-06-28T10:00:00.000Z",
  updatedAt: "2026-06-28T10:00:00.000Z",
};

export class FakeObjectivesGateway implements ObjectivesGateway {
  readonly calls: RecordedCall[] = [];
  objectives = [Objective.from(objectiveDto)];

  private record(method: string, ...args: unknown[]) {
    this.calls.push({ method, args });
  }

  callsTo(method: string): RecordedCall[] {
    return this.calls.filter((call) => call.method === method);
  }

  async listObjectives(): Promise<Objective[]> {
    this.record("listObjectives");
    return this.objectives;
  }

  async getObjective(id: string): Promise<Objective | null> {
    this.record("getObjective", id);
    return this.objectives.find((objective) => objective.id === id) ?? null;
  }

  async createObjective(input: CreateObjectiveInput): Promise<Objective> {
    this.record("createObjective", input);
    const objective = Objective.from({
      ...objectiveDto,
      ...input,
      id: "created",
      manualValue: input.manualValue ?? null,
      updatedAt: "2026-06-28T12:00:00.000Z",
    });
    this.objectives = [objective, ...this.objectives];
    return objective;
  }

  async updateObjective(id: string, input: UpdateObjectiveInput): Promise<Objective> {
    this.record("updateObjective", id, input);
    const current = this.objectives.find((objective) => objective.id === id) ?? Objective.from(objectiveDto);
    const objective = Objective.from({
      id,
      title: input.title ?? current.title,
      periodStart: input.periodStart ?? current.periodStart,
      periodEnd: input.periodEnd ?? current.periodEnd,
      metricSource: input.metricSource ?? current.metricSource,
      target: input.target ?? current.target,
      unit: input.unit ?? current.unit,
      manualValue: input.manualValue === undefined ? current.manualValue : input.manualValue,
      status: current.status,
      archivedAt: current.archivedAt,
      achievedAt: current.achievedAt,
      createdAt: current.createdAt,
      updatedAt: "2026-06-28T12:00:00.000Z",
    });
    this.objectives = this.objectives.map((candidate) => (candidate.id === id ? objective : candidate));
    return objective;
  }

  async archiveObjective(id: string): Promise<Objective> {
    this.record("archiveObjective", id);
    const current = this.objectives.find((objective) => objective.id === id) ?? Objective.from(objectiveDto);
    const objective = Objective.from({
      id,
      title: current.title,
      periodStart: current.periodStart,
      periodEnd: current.periodEnd,
      metricSource: current.metricSource,
      target: current.target,
      unit: current.unit,
      manualValue: current.manualValue,
      status: "archived",
      archivedAt: "2026-06-28T12:00:00.000Z",
      achievedAt: current.achievedAt,
      createdAt: current.createdAt,
      updatedAt: "2026-06-28T12:00:00.000Z",
    });
    this.objectives = this.objectives.map((candidate) => (candidate.id === id ? objective : candidate));
    return objective;
  }

  async markObjectiveAchieved(id: string): Promise<Objective> {
    this.record("markObjectiveAchieved", id);
    const current = this.objectives.find((objective) => objective.id === id) ?? Objective.from(objectiveDto);
    const objective = Objective.from({
      id,
      title: current.title,
      periodStart: current.periodStart,
      periodEnd: current.periodEnd,
      metricSource: current.metricSource,
      target: current.target,
      unit: current.unit,
      manualValue: current.manualValue,
      status: "achieved",
      archivedAt: current.archivedAt,
      achievedAt: current.achievedAt ?? "2026-06-28T12:00:00.000Z",
      createdAt: current.createdAt,
      updatedAt: "2026-06-28T12:00:00.000Z",
    });
    this.objectives = this.objectives.map((candidate) => (candidate.id === id ? objective : candidate));
    return objective;
  }
}

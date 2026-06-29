import { Objective, type ObjectiveCurrency, type ObjectiveMetricSource, type ObjectiveUpdate } from './Objective';

export type CreateObjectiveData = {
    readonly title: string;
    readonly periodStart: string;
    readonly periodEnd: string;
    readonly metricSource: ObjectiveMetricSource;
    readonly metricTargetId?: string | null;
    readonly target: number;
    readonly unit: string;
    readonly manualValue?: number | null;
    readonly currency?: ObjectiveCurrency | null;
};

export type UpdateObjectiveData = ObjectiveUpdate;

export abstract class ObjectiveRepository {
    abstract createObjective(userId: string, data: CreateObjectiveData): Promise<Objective>;
    abstract getObjective(userId: string, id: string): Promise<Objective | null>;
    abstract listObjectives(userId: string): Promise<Objective[]>;
    abstract save(userId: string, objective: Objective): Promise<Objective>;
}

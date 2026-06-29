import { randomUUID } from 'crypto';

import { Objective, type ObjectiveSnapshot } from '../../domain/Objective';
import { type CreateObjectiveData, ObjectiveRepository } from '../../domain/ObjectiveRepository';

export class FakeObjectiveRepository extends ObjectiveRepository {
    private store = new Map<string, ObjectiveSnapshot>();
    private owners = new Map<string, string>();
    lastCreateUserId: string | null = null;

    async createObjective(userId: string, data: CreateObjectiveData): Promise<Objective> {
        this.lastCreateUserId = userId;
        const now = new Date();
        const objective = Objective.fromSnapshot({
            id: randomUUID(),
            ownerUserId: userId,
            title: data.title,
            periodStart: data.periodStart,
            periodEnd: data.periodEnd,
            metricSource: data.metricSource,
            metricTargetId: data.metricSource === 'health_habit_completions' ? data.metricTargetId ?? null : null,
            target: data.target,
            unit: data.unit,
            manualValue: data.metricSource === 'manual' ? data.manualValue ?? null : null,
            currency: data.metricSource === 'wallet_savings' ? data.currency ?? null : null,
            status: 'active',
            archivedAt: null,
            achievedAt: null,
            createdAt: now,
            updatedAt: now,
        });
        this.store.set(objective.id, objective.toSnapshot());
        this.owners.set(objective.id, userId);
        return objective;
    }

    async getObjective(userId: string, id: string): Promise<Objective | null> {
        if (this.owners.get(id) !== userId) return null;
        const snapshot = this.store.get(id);
        return snapshot ? Objective.fromSnapshot(snapshot) : null;
    }

    async listObjectives(userId: string): Promise<Objective[]> {
        return Array.from(this.store.entries())
            .filter(([id]) => this.owners.get(id) === userId)
            .map(([, snapshot]) => Objective.fromSnapshot(snapshot));
    }

    async save(userId: string, objective: Objective): Promise<Objective> {
        if (this.owners.get(objective.id) !== userId) {
            throw new Error('Objective not found');
        }
        this.store.set(objective.id, objective.toSnapshot());
        return objective;
    }
}

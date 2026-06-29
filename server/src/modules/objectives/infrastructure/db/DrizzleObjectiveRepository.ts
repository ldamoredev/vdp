import { and, desc, eq } from 'drizzle-orm';

import { Database } from '../../../common/base/db/Database';
import { Objective } from '../../domain/Objective';
import { CreateObjectiveData, ObjectiveRepository } from '../../domain/ObjectiveRepository';
import { objectives } from './schema';

export class DrizzleObjectiveRepository extends ObjectiveRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async createObjective(userId: string, data: CreateObjectiveData): Promise<Objective> {
        const [row] = await this.db.query
            .insert(objectives)
            .values({
                ownerUserId: userId,
                title: data.title,
                periodStart: data.periodStart,
                periodEnd: data.periodEnd,
                metricSource: data.metricSource,
                target: String(data.target),
                unit: data.unit,
                manualValue: data.metricSource === 'manual' && data.manualValue !== undefined
                    ? String(data.manualValue)
                    : null,
            })
            .returning();

        return this.toObjective(row);
    }

    async getObjective(userId: string, id: string): Promise<Objective | null> {
        const [row] = await this.db.query
            .select()
            .from(objectives)
            .where(and(eq(objectives.id, id), eq(objectives.ownerUserId, userId)))
            .limit(1);

        return row ? this.toObjective(row) : null;
    }

    async listObjectives(userId: string): Promise<Objective[]> {
        const rows = await this.db.query
            .select()
            .from(objectives)
            .where(eq(objectives.ownerUserId, userId))
            .orderBy(desc(objectives.updatedAt));

        return rows.map((row) => this.toObjective(row));
    }

    async save(userId: string, objective: Objective): Promise<Objective> {
        const snapshot = objective.toSnapshot();
        const [row] = await this.db.query
            .update(objectives)
            .set({
                title: snapshot.title,
                periodStart: snapshot.periodStart,
                periodEnd: snapshot.periodEnd,
                metricSource: snapshot.metricSource,
                target: String(snapshot.target),
                unit: snapshot.unit,
                manualValue: snapshot.manualValue === null ? null : String(snapshot.manualValue),
                status: snapshot.status,
                archivedAt: snapshot.archivedAt,
                achievedAt: snapshot.achievedAt,
                updatedAt: snapshot.updatedAt,
            })
            .where(and(eq(objectives.id, snapshot.id), eq(objectives.ownerUserId, userId)))
            .returning();

        return this.toObjective(row);
    }

    private toObjective(row: typeof objectives.$inferSelect): Objective {
        return Objective.fromSnapshot({
            id: row.id,
            ownerUserId: row.ownerUserId,
            title: row.title,
            periodStart: row.periodStart,
            periodEnd: row.periodEnd,
            metricSource: row.metricSource,
            target: Number(row.target),
            unit: row.unit,
            manualValue: row.manualValue === null ? null : Number(row.manualValue),
            status: row.status,
            archivedAt: row.archivedAt,
            achievedAt: row.achievedAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
}

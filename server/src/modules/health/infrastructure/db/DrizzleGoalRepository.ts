import { and, desc, eq } from 'drizzle-orm';
import { Database } from '../../../common/base/db/Database';
import { Goal } from '../../domain/Goal';
import { CreateGoalData, GoalRepository } from '../../domain/GoalRepository';
import { goals } from './schema';

export class DrizzleGoalRepository extends GoalRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async createGoal(userId: string, data: CreateGoalData): Promise<Goal> {
        const [row] = await this.db.query
            .insert(goals)
            .values({
                ownerUserId: userId,
                title: data.title,
                notes: data.notes ?? null,
                targetDate: data.targetDate,
            })
            .returning();

        return this.toGoal(row);
    }

    async getGoal(userId: string, id: string): Promise<Goal | null> {
        const [row] = await this.db.query
            .select()
            .from(goals)
            .where(and(eq(goals.id, id), eq(goals.ownerUserId, userId)))
            .limit(1);

        return row ? this.toGoal(row) : null;
    }

    async listGoals(userId: string): Promise<Goal[]> {
        const rows = await this.db.query
            .select()
            .from(goals)
            .where(eq(goals.ownerUserId, userId))
            .orderBy(desc(goals.createdAt));

        return rows.map((row) => this.toGoal(row));
    }

    async save(userId: string, goal: Goal): Promise<Goal> {
        const snapshot = goal.toSnapshot();
        const [row] = await this.db.query
            .update(goals)
            .set({
                title: snapshot.title,
                notes: snapshot.notes,
                targetDate: snapshot.targetDate,
                status: snapshot.status,
                deadlineNotified: snapshot.deadlineNotified,
                completedAt: snapshot.completedAt,
                updatedAt: snapshot.updatedAt,
            })
            .where(and(eq(goals.id, snapshot.id), eq(goals.ownerUserId, userId)))
            .returning();

        return this.toGoal(row);
    }

    private toGoal(row: typeof goals.$inferSelect): Goal {
        return Goal.fromSnapshot({
            id: row.id,
            title: row.title,
            notes: row.notes,
            targetDate: row.targetDate,
            status: row.status,
            deadlineNotified: row.deadlineNotified,
            completedAt: row.completedAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
}

import { and, desc, eq } from 'drizzle-orm';

import { Database } from '../../../common/base/db/Database';
import { Project } from '../../domain/Project';
import { CreateProjectData, ProjectRepository } from '../../domain/ProjectRepository';
import { projects } from './schema';

export class DrizzleProjectRepository extends ProjectRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async createProject(userId: string, data: CreateProjectData): Promise<Project> {
        const [row] = await this.db.query
            .insert(projects)
            .values({
                ownerUserId: userId,
                kind: data.kind,
                outcome: data.outcome,
                nextAction: data.nextAction,
                focus: data.focus,
                clientId: data.clientId ?? null,
                client: data.client ?? null,
                hourlyRate: data.hourlyRate ?? null,
                rateCurrency: data.rateCurrency ?? 'ARS',
            })
            .returning();

        return this.toProject(row);
    }

    async getProject(userId: string, id: string): Promise<Project | null> {
        const [row] = await this.db.query
            .select()
            .from(projects)
            .where(and(eq(projects.id, id), eq(projects.ownerUserId, userId)))
            .limit(1);

        return row ? this.toProject(row) : null;
    }

    async listProjects(userId: string): Promise<Project[]> {
        const rows = await this.db.query
            .select()
            .from(projects)
            .where(eq(projects.ownerUserId, userId))
            .orderBy(desc(projects.createdAt));

        return rows.map((row) => this.toProject(row));
    }

    async save(userId: string, project: Project): Promise<Project> {
        const snapshot = project.toSnapshot();
        const [row] = await this.db.query
            .update(projects)
            .set({
                kind: snapshot.kind,
                outcome: snapshot.outcome,
                nextAction: snapshot.nextAction,
                focus: snapshot.focus,
                clientId: snapshot.clientId,
                client: snapshot.client,
                hourlyRate: snapshot.hourlyRate,
                rateCurrency: snapshot.rateCurrency,
                status: snapshot.status,
                archivedAt: snapshot.archivedAt,
                updatedAt: snapshot.updatedAt,
            })
            .where(and(eq(projects.id, snapshot.id), eq(projects.ownerUserId, userId)))
            .returning();

        return this.toProject(row);
    }

    private toProject(row: typeof projects.$inferSelect): Project {
        return Project.fromSnapshot({
            id: row.id,
            kind: row.kind,
            outcome: row.outcome,
            nextAction: row.nextAction,
            focus: row.focus,
            clientId: row.clientId,
            client: row.client,
            hourlyRate: row.hourlyRate,
            rateCurrency: row.rateCurrency,
            status: row.status,
            archivedAt: row.archivedAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
}

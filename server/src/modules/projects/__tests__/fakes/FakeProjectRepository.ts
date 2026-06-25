import { randomUUID } from 'crypto';

import { Project, type ProjectSnapshot } from '../../domain/Project';
import {
    type CreateProjectData,
    ProjectRepository,
} from '../../domain/ProjectRepository';

export class FakeProjectRepository extends ProjectRepository {
    private store = new Map<string, ProjectSnapshot>();
    lastCreateUserId: string | null = null;

    async createProject(userId: string, data: CreateProjectData): Promise<Project> {
        this.lastCreateUserId = userId;
        const now = new Date();
        const project = Project.fromSnapshot({
            id: randomUUID(),
            kind: data.kind,
            outcome: data.outcome,
            nextAction: data.nextAction,
            focus: data.focus,
            client: data.client ?? null,
            status: 'active',
            archivedAt: null,
            createdAt: now,
            updatedAt: now,
        });
        this.store.set(project.id, project.toSnapshot());
        return project;
    }

    async getProject(_userId: string, id: string): Promise<Project | null> {
        const snapshot = this.store.get(id);
        return snapshot ? Project.fromSnapshot(snapshot) : null;
    }

    async listProjects(_userId: string): Promise<Project[]> {
        return Array.from(this.store.values()).map(Project.fromSnapshot);
    }

    async save(_userId: string, project: Project): Promise<Project> {
        this.store.set(project.id, project.toSnapshot());
        return project;
    }
}

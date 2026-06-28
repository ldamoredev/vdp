import { randomUUID } from 'crypto';

import { Project, type ProjectSnapshot } from '../../domain/Project';
import {
    type CreateProjectData,
    ProjectRepository,
} from '../../domain/ProjectRepository';

export class FakeProjectRepository extends ProjectRepository {
    private store = new Map<string, ProjectSnapshot>();
    private owners = new Map<string, string>();
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
            clientId: data.clientId ?? null,
            client: data.client ?? null,
            hourlyRate: data.hourlyRate ?? null,
            rateCurrency: data.rateCurrency ?? 'ARS',
            status: 'active',
            archivedAt: null,
            createdAt: now,
            updatedAt: now,
        });
        this.store.set(project.id, project.toSnapshot());
        this.owners.set(project.id, userId);
        return project;
    }

    async getProject(userId: string, id: string): Promise<Project | null> {
        if (this.owners.get(id) !== userId) return null;
        const snapshot = this.store.get(id);
        return snapshot ? Project.fromSnapshot(snapshot) : null;
    }

    async listProjects(userId: string): Promise<Project[]> {
        return Array.from(this.store.entries())
            .filter(([id]) => this.owners.get(id) === userId)
            .map(([, snapshot]) => Project.fromSnapshot(snapshot));
    }

    async save(userId: string, project: Project): Promise<Project> {
        if (this.owners.get(project.id) !== userId) {
            throw new Error('Project not found');
        }
        this.store.set(project.id, project.toSnapshot());
        return project;
    }
}

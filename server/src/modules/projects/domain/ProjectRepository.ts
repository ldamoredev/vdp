import { Project, type ProjectKind, type ProjectRateCurrency } from './Project';

export type CreateProjectData = {
    readonly kind: ProjectKind;
    readonly outcome: string;
    readonly nextAction: string;
    readonly focus: string;
    readonly clientId?: string | null;
    readonly client?: string | null;
    readonly hourlyRate?: string | null;
    readonly rateCurrency?: ProjectRateCurrency;
};

export type UpdateProjectData = Partial<CreateProjectData>;

export abstract class ProjectRepository {
    abstract createProject(userId: string, data: CreateProjectData): Promise<Project>;
    abstract getProject(userId: string, id: string): Promise<Project | null>;
    abstract listProjects(userId: string): Promise<Project[]>;
    abstract save(userId: string, project: Project): Promise<Project>;
}

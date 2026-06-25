import { Project, type ProjectKind } from './Project';

export type CreateProjectData = {
    readonly kind: ProjectKind;
    readonly outcome: string;
    readonly nextAction: string;
    readonly focus: string;
    readonly client?: string | null;
};

export type UpdateProjectData = Partial<CreateProjectData>;

export abstract class ProjectRepository {
    abstract createProject(userId: string, data: CreateProjectData): Promise<Project>;
    abstract getProject(userId: string, id: string): Promise<Project | null>;
    abstract listProjects(userId: string): Promise<Project[]>;
    abstract save(userId: string, project: Project): Promise<Project>;
}

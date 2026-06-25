import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Project } from '../domain/Project';
import { ProjectRepository, UpdateProjectData } from '../domain/ProjectRepository';

export class UpdateProjectCommand extends Command<Project | null> {
    constructor(
        readonly id: string,
        readonly input: UpdateProjectData,
    ) {
        super();
    }
}

export class UpdateProjectCommandHandler implements RequestHandler<UpdateProjectCommand, Project | null> {
    constructor(private readonly projects: ProjectRepository) {}

    async handle(command: UpdateProjectCommand, identity: Identity): Promise<Project | null> {
        const { userId } = requireUserIdentity(identity);
        const project = await this.projects.getProject(userId, command.id);
        if (!project) return null;
        project.updateDirection(command.input);
        return this.projects.save(userId, project);
    }
}

import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Project } from '../domain/Project';
import { CreateProjectData, ProjectRepository } from '../domain/ProjectRepository';

export class CreateProjectCommand extends Command<Project> {
    constructor(readonly input: CreateProjectData) {
        super();
    }
}

export class CreateProjectCommandHandler implements RequestHandler<CreateProjectCommand, Project> {
    constructor(private readonly projects: ProjectRepository) {}

    async handle(command: CreateProjectCommand, identity: Identity): Promise<Project> {
        const { userId } = requireUserIdentity(identity);
        return this.projects.createProject(userId, command.input);
    }
}

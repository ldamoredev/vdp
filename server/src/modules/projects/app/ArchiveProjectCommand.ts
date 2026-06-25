import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Project } from '../domain/Project';
import { ProjectRepository } from '../domain/ProjectRepository';

export class ArchiveProjectCommand extends Command<Project | null> {
    constructor(readonly id: string) {
        super();
    }
}

export class ArchiveProjectCommandHandler implements RequestHandler<ArchiveProjectCommand, Project | null> {
    constructor(private readonly projects: ProjectRepository) {}

    async handle(command: ArchiveProjectCommand, identity: Identity): Promise<Project | null> {
        const { userId } = requireUserIdentity(identity);
        const project = await this.projects.getProject(userId, command.id);
        if (!project) return null;
        project.archive();
        return this.projects.save(userId, project);
    }
}

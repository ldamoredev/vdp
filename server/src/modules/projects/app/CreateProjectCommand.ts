import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { NotFoundHttpError } from '../../common/http/errors';
import { Project } from '../domain/Project';
import { ClientRepository } from '../domain/ClientRepository';
import { CreateProjectData, ProjectRepository } from '../domain/ProjectRepository';

export class CreateProjectCommand extends Command<Project> {
    constructor(readonly input: CreateProjectData) {
        super();
    }
}

export class CreateProjectCommandHandler implements RequestHandler<CreateProjectCommand, Project> {
    constructor(
        private readonly projects: ProjectRepository,
        private readonly clients: ClientRepository,
    ) {}

    async handle(command: CreateProjectCommand, identity: Identity): Promise<Project> {
        const { userId } = requireUserIdentity(identity);
        if (command.input.clientId) {
            const client = await this.clients.getClient(userId, command.input.clientId);
            if (!client) throw new NotFoundHttpError('Client not found');
        }
        return this.projects.createProject(userId, command.input);
    }
}

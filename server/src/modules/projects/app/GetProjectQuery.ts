import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Project } from '../domain/Project';
import { ProjectRepository } from '../domain/ProjectRepository';

export class GetProjectQuery extends Query<Project | null> {
    constructor(readonly id: string) {
        super();
    }
}

export class GetProjectQueryHandler implements RequestHandler<GetProjectQuery, Project | null> {
    constructor(private readonly projects: ProjectRepository) {}

    async handle(query: GetProjectQuery, identity: Identity): Promise<Project | null> {
        const { userId } = requireUserIdentity(identity);
        return this.projects.getProject(userId, query.id);
    }
}

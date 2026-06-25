import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Project } from '../domain/Project';
import { ProjectRepository } from '../domain/ProjectRepository';

export class ListProjectsQuery extends Query<Project[]> {}

export class ListProjectsQueryHandler implements RequestHandler<ListProjectsQuery, Project[]> {
    constructor(private readonly projects: ProjectRepository) {}

    async handle(_query: ListProjectsQuery, identity: Identity): Promise<Project[]> {
        const { userId } = requireUserIdentity(identity);
        return this.projects.listProjects(userId);
    }
}

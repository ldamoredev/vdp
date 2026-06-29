import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Objective } from '../domain/Objective';
import { ObjectiveRepository } from '../domain/ObjectiveRepository';

export class ListObjectivesQuery extends Query<Objective[]> {}

export class ListObjectivesQueryHandler implements RequestHandler<ListObjectivesQuery, Objective[]> {
    constructor(private readonly objectives: ObjectiveRepository) {}

    async handle(_query: ListObjectivesQuery, identity: Identity): Promise<Objective[]> {
        const { userId } = requireUserIdentity(identity);
        return this.objectives.listObjectives(userId);
    }
}

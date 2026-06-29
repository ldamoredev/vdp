import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Objective } from '../domain/Objective';
import { ObjectiveRepository } from '../domain/ObjectiveRepository';

export class GetObjectiveQuery extends Query<Objective | null> {
    constructor(readonly id: string) {
        super();
    }
}

export class GetObjectiveQueryHandler implements RequestHandler<GetObjectiveQuery, Objective | null> {
    constructor(private readonly objectives: ObjectiveRepository) {}

    async handle(query: GetObjectiveQuery, identity: Identity): Promise<Objective | null> {
        const { userId } = requireUserIdentity(identity);
        return this.objectives.getObjective(userId, query.id);
    }
}

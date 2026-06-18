import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { DomainStat, TaskRepository } from '../domain/TaskRepository';
import { GetCompletionByDomain } from '../services/GetCompletionByDomain';

export class GetCompletionByDomainQuery extends Query<DomainStat[]> {
    constructor(
        readonly from?: string,
        readonly to?: string,
    ) {
        super();
    }
}

export class GetCompletionByDomainQueryHandler implements RequestHandler<GetCompletionByDomainQuery, DomainStat[]> {
    constructor(private readonly tasks: TaskRepository) {}

    async handle(query: GetCompletionByDomainQuery, identity: Identity): Promise<DomainStat[]> {
        const { userId } = requireUserIdentity(identity);
        return new GetCompletionByDomain(this.tasks).execute(userId, query.from, query.to);
    }
}
